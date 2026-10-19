import { Header } from './header';

type InfoSection = {
  title: string;
  content: string[];
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
  children?: React.ReactNode;
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
            <div className="mt-4 space-y-3">
              {section.content.map((paragraph) => (
                <p className="text-sm leading-7 text-muted" key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
        {children}
      </section>
    </main>
  );
}