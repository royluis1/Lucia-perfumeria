import { siteConfig } from '../lib/brand';

export function WhatsAppButton() {
  if (!siteConfig.contact.whatsappEnabled) return null;

  return (
    <a
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex min-h-11 items-center gap-2 rounded-full bg-ink px-5 text-xs font-semibold uppercase tracking-[0.12em] text-white shadow-lg transition-colors hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      href={siteConfig.contact.whatsappUrl}
      rel="noopener noreferrer"
      target="_blank"
    >
      WhatsApp
    </a>
  );
}
