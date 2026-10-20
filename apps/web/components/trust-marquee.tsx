'use client';

import { useEffect, useRef, useState } from 'react';

const items = [
  'Envíos a todo el país',
  'Pago con Mercado Pago',
  'Fragancias originales',
  'Cambios sin complicaciones',
];

export function TrustMarquee() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? true),
      { rootMargin: '120px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      aria-label="Beneficios de compra"
      className="overflow-hidden border-y border-black/20 bg-black py-4 text-white"
      ref={sectionRef}
    >
      <div className={`mq flex w-max items-center whitespace-nowrap ${inView ? '' : 'mq-paused'}`}>
        {[0, 1].map((copy) => (
          <div aria-hidden={copy === 1} className="flex items-center" key={copy}>
            {items.map((item) => (
              <span className="flex items-center" key={`${copy}-${item}`}>
                <span className="px-8 text-xs font-semibold uppercase tracking-[0.3em]">{item}</span>
                <span aria-hidden="true" className="h-1.5 w-1.5 rotate-45 bg-sand/70" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
