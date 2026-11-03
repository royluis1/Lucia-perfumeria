import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { lookup as dnsLookup } from 'dns/promises';
import { unlink } from 'fs/promises';
import { basename, extname, join, resolve } from 'path';
import { randomUUID } from 'crypto';
import { isIP } from 'net';
import { request as httpsRequest } from 'https';
import { del, put } from '@vercel/blob';
import sharp from 'sharp';

const MAX_IMAGE_DIMENSION = 1600;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECTS = 3;
const IMAGE_CONTENT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function isPublicIpv4(address: string) {
  const octets = address.split('.').map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return false;
  }
  const [first, second, third] = octets;
  return !(
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0 && (third === 0 || third === 2)) ||
    (first === 192 && second === 168) ||
    (first === 192 && second === 88 && third === 99) ||
    (first === 198 && (second === 18 || second === 19)) ||
    (first === 198 && second === 51 && third === 100) ||
    (first === 203 && second === 0 && third === 113) ||
    first >= 224
  );
}

function parseRemoteImageUrl(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new BadRequestException('Pegá un enlace válido a una imagen.');
  }

  const hostname = url.hostname.replace(/\.$/, '').toLowerCase();
  if (
    url.protocol !== 'https:' ||
    !hostname ||
    isIP(hostname) ||
    url.username ||
    url.password ||
    (url.port && url.port !== '443') ||
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal')
  ) {
    throw new BadRequestException('El enlace debe ser HTTPS y apuntar a una imagen pública.');
  }

  url.hostname = hostname;
  return url;
}

async function lookupPublicIpv4(hostname: string) {
  const records = await dnsLookup(hostname, { all: true, verbatim: true });
  const addresses = records.filter((record) => record.family === 4).map((record) => record.address);
  if (addresses.length === 0 || addresses.some((address) => !isPublicIpv4(address))) {
    throw new Error('El dominio del enlace no resuelve a una dirección pública.');
  }
  return addresses[0];
}

function downloadImage(url: URL, redirectsRemaining = MAX_REDIRECTS): Promise<{ buffer: Buffer; contentType: string }> {
  return new Promise((resolveDownload, rejectDownload) => {
    void lookupPublicIpv4(url.hostname)
      .then((address) => {
        const request = httpsRequest(
          {
            hostname: url.hostname,
            port: 443,
            path: `${url.pathname}${url.search}`,
            method: 'GET',
            headers: { Accept: 'image/jpeg,image/png,image/webp', 'User-Agent': 'LuciaPerfumeriaImageImporter/1.0' },
            lookup: (_hostname, options, callback) => {
              if (options.all) {
                callback(null, [{ address, family: 4 }]);
                return;
              }
              callback(null, address, 4);
            },
            agent: false,
            timeout: 10_000,
          },
          (response) => {
            const status = response.statusCode ?? 0;
            if ([301, 302, 303, 307, 308].includes(status)) {
              const location = response.headers.location;
              response.resume();
              if (!location || redirectsRemaining <= 0) {
                rejectDownload(new Error('El enlace redirige demasiadas veces o no tiene destino válido.'));
                return;
              }
              let redirectUrl: URL;
              try {
                redirectUrl = parseRemoteImageUrl(new URL(location, url).toString());
              } catch (error) {
                rejectDownload(error);
                return;
              }
              void downloadImage(redirectUrl, redirectsRemaining - 1).then(resolveDownload, rejectDownload);
              return;
            }

            const contentType = response.headers['content-type']?.split(';', 1)[0].trim().toLowerCase() ?? '';
            const contentLength = Number(response.headers['content-length'] ?? 0);
            if (status !== 200 || !IMAGE_CONTENT_TYPES.has(contentType)) {
              response.resume();
              rejectDownload(new Error('El enlace no devuelve una imagen JPG, PNG o WebP pública.'));
              return;
            }
            if (contentLength > MAX_IMAGE_SIZE_BYTES) {
              response.resume();
              rejectDownload(new Error('La imagen del enlace supera el límite de 5 MB.'));
              return;
            }

            const chunks: Buffer[] = [];
            let size = 0;
            response.on('data', (chunk: Buffer | string) => {
              const data = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
              size += data.length;
              if (size > MAX_IMAGE_SIZE_BYTES) {
                response.destroy(new Error('La imagen del enlace supera el límite de 5 MB.'));
                return;
              }
              chunks.push(data);
            });
            response.on('end', () => resolveDownload({ buffer: Buffer.concat(chunks), contentType }));
            response.on('error', rejectDownload);
          },
        );
        request.on('timeout', () => request.destroy(new Error('Se agotó el tiempo de espera al descargar la imagen.')));
        request.on('error', rejectDownload);
        request.end();
      })
      .catch(rejectDownload);
  });
}

export function isVercelBlobUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      url.hostname.endsWith('.public.blob.vercel-storage.com') &&
      url.pathname.length > 1
    );
  } catch {
    return false;
  }
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  private readonly uploadsRoot = resolve(process.cwd(), process.env.UPLOADS_DIR?.trim() || 'public');
  private readonly uploadsDir = join(this.uploadsRoot, 'products');

  get remoteEnabled(): boolean {
    return Boolean(this.token);
  }

  private async optimize(buffer: Buffer): Promise<{ data: Buffer; ext: string; contentType: string } | null> {
    try {
      const data = await sharp(buffer)
        .rotate()
        .resize({ width: MAX_IMAGE_DIMENSION, height: MAX_IMAGE_DIMENSION, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      return { data, ext: '.webp', contentType: 'image/webp' };
    } catch (error) {
      this.logger.warn(`No se pudo optimizar la imagen, se guarda el original: ${(error as Error).message}`);
      return null;
    }
  }

  async uploadImage(
    buffer: Buffer,
    originalName: string,
    contentType?: string,
    folder: 'products' | 'store' = 'products',
  ): Promise<string> {
    if (!this.token) {
      throw new ServiceUnavailableException('El almacenamiento de imágenes no está configurado.');
    }

    const optimized = await this.optimize(buffer);
    const data = optimized?.data ?? buffer;
    const ext = optimized?.ext ?? extname(originalName).toLowerCase();
    const effectiveContentType = optimized?.contentType ?? contentType;
    const filename = `${randomUUID()}${ext}`;

    const blob = await put(`${folder}/${filename}`, data, {
      access: 'public',
      token: this.token,
      contentType: effectiveContentType,
      addRandomSuffix: false,
    });
    return blob.url;
  }

  async importImageFromUrl(value: string): Promise<string> {
    if (!this.token) {
      throw new ServiceUnavailableException('El almacenamiento de imágenes no está configurado. Revisá BLOB_READ_WRITE_TOKEN en Render.');
    }

    const url = parseRemoteImageUrl(value.trim());
    let downloaded: { buffer: Buffer; contentType: string };
    try {
      downloaded = await downloadImage(url);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      const message = error instanceof Error ? error.message : 'Error desconocido';
      throw new BadRequestException(`No se pudo descargar la imagen: ${message}`);
    }

    let imageFormat: string | undefined;
    try {
      imageFormat = (await sharp(downloaded.buffer, { limitInputPixels: 40_000_000 }).metadata()).format;
    } catch {
      throw new BadRequestException('El enlace no contiene una imagen válida.');
    }
    if (!imageFormat || !['jpeg', 'png', 'webp'].includes(imageFormat)) {
      throw new BadRequestException('El contenido descargado no es una imagen JPG, PNG o WebP válida.');
    }
    return this.uploadImage(downloaded.buffer, `imported-image.${imageFormat}`, downloaded.contentType);
  }

  async deleteImage(url: string): Promise<void> {
    try {
      if (/^https?:\/\//i.test(url)) {
        if (!this.token || !isVercelBlobUrl(url)) return;
        await del(url, { token: this.token });
        return;
      }

      const filepath = join(this.uploadsDir, basename(url));
      if (!filepath.startsWith(this.uploadsDir)) return;
      await unlink(filepath);
    } catch (error) {
      this.logger.warn(`No se pudo borrar la imagen ${url}: ${(error as Error).message}`);
    }
  }
}
