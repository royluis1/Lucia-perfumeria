'use client';

import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { siteConfig } from '../lib/brand';

export function RoyTechAttribution() {
  const pathname = usePathname();

  if (pathname === '/login' || pathname === '/checkout') return null;

  return (
    <div className="mx-auto mt-10 flex max-w-7xl flex-col items-center gap-3 border-t border-white/15 pt-5 sm:flex-row sm:justify-end">
      <a
        aria-label="Creado por RoyTech, abrir portafolio"
        className="group inline-flex min-h-11 items-center gap-3 rounded-sm px-2 text-white/70 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        href={siteConfig.portfolioUrl}
        rel="noopener noreferrer"
        target="_blank"
      >
        <span className="text-[11px] font-light tracking-[0.18em]">Created by</span>
        <picture className="flex items-center">
          <source srcSet="/roytech-logo.webp" type="image/webp" />
          <Image
            alt="RoyTech"
            className="h-auto w-[120px] mix-blend-screen transition-[filter] duration-[250ms] ease-out group-hover:brightness-125 motion-reduce:transition-none sm:w-[140px]"
            height={56}
            loading="lazy"
            sizes="(max-width: 640px) 120px, 140px"
            src="/roytech-logo.png"
            width={280}
          />
        </picture>
      </a>
    </div>
  );
}
