import { HeadphonesIcon, RefreshIcon, ShieldIcon, TruckIcon } from './icons';

const benefits = [
  {
    Icon: TruckIcon,
    title: 'Envíos a todo el país',
    text: 'Despachamos en 24-48 h a cualquier punto de Argentina.',
  },
  {
    Icon: ShieldIcon,
    title: 'Pago seguro',
    text: 'Mercado Pago, transferencia o tarjetas con protección.',
  },
  {
    Icon: RefreshIcon,
    title: 'Cambios sin complicaciones',
    text: 'Tenés 30 días para cambiar tu fragancia.',
  },
  {
    Icon: HeadphonesIcon,
    title: 'Atención personalizada',
    text: 'Te ayudamos a elegir tu aroma por WhatsApp.',
  },
];

export function BenefitsRow() {
  return (
    <section className="border-t border-line bg-white px-6 py-16">
      <div className="mx-auto grid max-w-7xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {benefits.map(({ Icon, title, text }) => (
          <div className="tr" key={title}>
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-line text-ink">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 text-xs font-extrabold uppercase tracking-[0.2em]">{title}</h3>
            <p className="mt-2 max-w-[26ch] text-sm leading-6 text-muted">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
