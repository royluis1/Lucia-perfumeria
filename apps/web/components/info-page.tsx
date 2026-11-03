import type { ReactNode } from 'react';
import { Header } from './header';

type InfoSection = {
  title: string;
  content: ReactNode[];
};

export function InfoPage({
  eyebrow,
  title,
  intro,
  sections,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  sections?: InfoSection[];
  children?: ReactNode;
}) {
  return (
    <main>
      <Header />
      <section className="mx-auto max-w-3xl px-6 py-16 md:py-24">
        <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted">{eyebrow}</p>
        <h1 className="mt-3 font-display text-5xl font-black uppercase tracking-[-0.02em] md:text-6xl">{title}</h1>
        {intro && <p className="mt-6 max-w-2xl text-sm leading-7 text-muted">{intro}</p>}
        {sections?.map((section) => (
          <section className="mt-12 border-t border-line pt-10" key={section.title}>
            <h2 className="font-display text-2xl font-black uppercase tracking-[-0.02em]">{section.title}</h2>
            <div className="mt-4 space-y-3 text-sm leading-7 text-muted">
              {section.content.map((paragraph, index) => (
                <p key={`${section.title}-${index}`}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
        {children}
      </section>
    </main>
  );
}