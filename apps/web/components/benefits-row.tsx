import { siteConfig } from '../lib/brand';
import { MapPinIcon, ShieldIcon, SparklesIcon } from './icons';

const icons = {
  payment: ShieldIcon,
  authenticity: SparklesIcon,
  location: MapPinIcon,
};

export function BenefitsRow() {
  return (
    <section className="border-t border-line bg-white px-6 py-16">
      <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {siteConfig.benefits.map(({ id, text }) => {
          const Icon = icons[id];
          return (
          <div className="tr" key={id}>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-line text-ink">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-xs font-extrabold uppercase tracking-[0.2em]">{text}</h3>
          </div>
          );
        })}
      </div>
    </section>
  );
}
