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
        <p className="text-xs uppercase tracking-[0.3em] text-black/50">{eyebrow}</p>
        <h1 className="mt-3 font-display text-5xl font-bold uppercase tracking-[-0.03em] md:text-6xl">{title}</h1>
        {intro && <p className="mt-6 max-w-2xl text-sm leading-7 text-black/65">{intro}</p>}
        {sections?.map((section) => (
          <section className="mt-12" key={section.title}>
            <h2 className="font-display text-2xl font-bold uppercase">{section.title}</h2>
            <div className="mt-4 space-y-3">
              {section.content.map((paragraph) => (
                <p className="text-sm leading-7 text-black/65" key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </div>
          </section>
        ))}
        {children}
      </section>
    </main>
  );
}