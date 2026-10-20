import { Injectable, Logger } from '@nestjs/common';
import { mkdirSync } from 'fs';
import { unlink, writeFile } from 'fs/promises';
import { basename, extname, join, resolve } from 'path';
import { randomUUID } from 'crypto';
import { del, put } from '@vercel/blob';
import sharp from 'sharp';

const MAX_IMAGE_DIMENSION = 1600;

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  private readonly uploadsRoot = resolve(process.cwd(), process.env.UPLOADS_DIR?.trim() || 'public');
  private readonly uploadsDir = join(this.uploadsRoot, 'products');
  private readonly uploadsPrefix = process.env.UPLOADS_PREFIX?.trim() || '/uploads';

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

  async uploadImage(buffer: Buffer, originalName: string, contentType?: string): Promise<string> {
    const optimized = await this.optimize(buffer);
    const data = optimized?.data ?? buffer;
    const ext = optimized?.ext ?? extname(originalName).toLowerCase();
    const effectiveContentType = optimized?.contentType ?? contentType;
    const filename = `${randomUUID()}${ext}`;

    if (this.token) {
      const blob = await put(`products/${filename}`, data, {
        access: 'public',
        token: this.token,
        contentType: effectiveContentType,
        addRandomSuffix: false,
      });
      return blob.url;
    }

    mkdirSync(this.uploadsDir, { recursive: true });
    await writeFile(join(this.uploadsDir, filename), data);
    return `${this.uploadsPrefix}/products/${filename}`;
  }

  async deleteImage(url: string): Promise<void> {
    try {
      if (/^https?:\/\//i.test(url)) {
        if (!this.token) return;
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
