'use client';

import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import { SmartImage } from './smart-image';

export type GalleryImage = {
  id: string;
  url: string;
  alt: string | null;
};

export function ProductGallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const total = images.length;
  const safeIndex = total === 0 ? 0 : Math.min(index, total - 1);
  const current = total > 0 ? images[safeIndex] : null;

  function go(step: number) {
    if (total < 2) return;
    setIndex((previous) => (previous + step + total) % total);
  }

  if (!current) {
    return (
      <div className="relative flex aspect-square items-center justify-center overflow-hidden border border-line bg-sand p-10">
        <div className="float h-72 w-40 bg-gradient-to-b from-white to-line shadow-2xl" />
      </div>
    );
  }

  return (
    <div className="select-none">
      <div
        aria-label="Galería de fotos"
        className="group relative flex aspect-square items-center justify-center overflow-hidden border border-line bg-sand p-10"
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault();
            go(-1);
          }
          if (event.key === 'ArrowRight') {
            event.preventDefault();
            go(1);
          }
        }}
        onTouchEnd={(event) => {
          if (touchStart === null) return;
          const delta = event.changedTouches[0].clientX - touchStart;
          if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1);
          setTouchStart(null);
        }}
        onTouchStart={(event) => setTouchStart(event.touches[0].clientX)}
        role="group"
        tabIndex={0}
      >
        <span
          className="absolute inset-0 block transition-transform duration-300 ease-out"
          onMouseEnter={() => setZoomed(true)}
          onMouseLeave={() => setZoomed(false)}
          onMouseMove={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 100;
            const y = ((event.clientY - rect.top) / rect.height) * 100;
            setOrigin(`${x}% ${y}%`);
          }}
          style={{ transform: zoomed ? 'scale(1.6)' : 'scale(1)', transformOrigin: origin }}
        >
          <SmartImage
            alt={current.alt ?? name}
            className={`gallery-swap object-contain ${zoomed ? '' : 'cursor-zoom-in'}`}
            key={current.id}
            priority
            sizes="(min-width: 768px) 50vw, 100vw"
            src={current.url}
          />
        </span>

        {total > 1 && (
          <>
            <button
              aria-label="Foto anterior"
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 border border-line bg-white/90 p-2 text-ink opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
              onClick={() => go(-1)}
              type="button"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              aria-label="Foto siguiente"
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 border border-line bg-white/90 p-2 text-ink opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
              onClick={() => go(1)}
              type="button"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
            <span className="absolute bottom-4 right-4 z-10 border border-line bg-white/90 px-2 py-1 text-[11px] font-semibold tracking-[0.14em] text-muted">
              {safeIndex + 1} / {total}
            </span>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {images.map((image, imageIndex) => (
            <button
              aria-label={`Ver foto ${imageIndex + 1}`}
              aria-pressed={imageIndex === safeIndex}
              className={`relative h-20 w-16 shrink-0 border transition-colors ${
                imageIndex === safeIndex ? 'border-black' : 'border-line hover:border-black/50'
              }`}
              key={image.id}
              onClick={() => setIndex(imageIndex)}
              type="button"
            >
              <SmartImage alt={image.alt ?? `${name} ${imageIndex + 1}`} className="object-cover" sizes="64px" src={image.url} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
