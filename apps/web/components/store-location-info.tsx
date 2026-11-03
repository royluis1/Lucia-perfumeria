'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { API_URL } from '../lib/config';
import { isVercelBlobUrl } from '../lib/api';
import { siteConfig } from '../lib/brand';

type StoreInfo = {
  businessHours: string | null;
  storePhotoUrl: string | null;
};

function isStoreInfo(value: unknown): value is StoreInfo {
  if (!value || typeof value !== 'object') return false;
  const info = value as Record<string, unknown>;
  return (
    (info.businessHours === null || typeof info.businessHours === 'string') &&
    (info.storePhotoUrl === null || typeof info.storePhotoUrl === 'string')
  );
}

export function StoreLocationInfo({ compact = false }: { compact?: boolean }) {
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadStoreInfo() {
      try {
        const response = await fetch(`${API_URL}/home/store-info`, {
          headers: { Accept: 'application/json' },
          cache: 'no-store',
        });
        if (!response.ok) throw new Error(`Store information request failed (${response.status})`);
        const result: unknown = await response.json();
        if (!isStoreInfo(result)) throw new Error('Store information response has an invalid shape');
        if (active) setStoreInfo(result);
      } catch (error) {
        console.error('No se pudo cargar la información del local.', error);
        if (active) setLoadError(true);
      }
    }

    void loadStoreInfo();
    return () => {
      active = false;
    };
  }, []);

  const photoUrl = storeInfo?.storePhotoUrl;
  const verifiedPhotoUrl = photoUrl && isVercelBlobUrl(photoUrl) ? photoUrl : null;

  return (
    <section className={compact ? 'mt-3 grid gap-3' : 'mt-8 grid gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] sm:items-start'} aria-label="Cómo llegar al local">
      <div>
        <p>{siteConfig.contact.address}, CP {siteConfig.contact.postalCode}</p>
        <a
          className="mt-2 inline-flex min-h-11 items-center underline underline-offset-4"
          href={siteConfig.contact.mapsUrl}
          rel="noopener noreferrer"
          target="_blank"
        >
          Cómo llegar
        </a>
        {storeInfo?.businessHours && (
          <div className="mt-3">
            <h3 className="font-semibold">Horarios</h3>
            <p className="whitespace-pre-line">{storeInfo.businessHours}</p>
          </div>
        )}
        {loadError && (
          <p className="mt-2 text-xs" role="status">
            No pudimos cargar los horarios del local en este momento.
          </p>
        )}
      </div>
      {verifiedPhotoUrl && (
        <div className={compact ? 'relative aspect-[4/3] w-full max-w-48 overflow-hidden' : 'relative aspect-[4/3] w-full overflow-hidden'}>
          <Image
            alt="Local de Lucía Perfumería"
            className="object-cover"
            fill
            loading="lazy"
            sizes={compact ? '192px' : '(min-width: 640px) 50vw, 100vw'}
            src={verifiedPhotoUrl}
          />
        </div>
      )}
    </section>
  );
}
