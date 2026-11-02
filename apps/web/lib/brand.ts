const address = {
  street: 'Pedernera 499',
  locality: 'Villa Mercedes',
  region: 'San Luis',
  postalCode: '5730',
};

export const siteConfig = {
  name: 'Lucía Perfumería',
  portfolioUrl: 'https://portafolio-web.royluis206.workers.dev',
  contact: {
    ...address,
    address: `${address.street}, ${address.locality}, ${address.region}`,
    mapsUrl: 'https://maps.google.com/?q=Pedernera+499,+Villa+Mercedes,+San+Luis,+5730',
    phone: '02657 43-4149',
    phoneHref: 'tel:+542657434149',
    email: 'luciaperfumes@yahoo.com.ar',
    instagramUrl: 'https://www.instagram.com/luciaperfumesvm/',
    facebookUrl: 'https://www.facebook.com/luciaperfumesvillamercedes/',
    whatsappEnabled: false,
    whatsappUrl: 'https://wa.me/5492657434149',
    legalName: undefined as string | undefined,
    cuit: undefined as string | undefined,
    businessHours: undefined as string | undefined,
  },
  benefits: [
    { id: 'payment', text: 'Pago con Mercado Pago' },
    { id: 'authenticity', text: 'Fragancias originales' },
    { id: 'location', text: `Local en ${address.locality}, ${address.street}` },
  ],
  heroDefaults: {
    title: 'Una esencia para cada versión de vos.',
    subtitle: 'La fragancia que despierta interés.',
    buttonLabel: 'Ver más de Hermès',
  },
} as const;

export const LEGAL_LINKS = {
  arrepentimiento: '/arrepentimiento',
  terminos: '/terminos',
  envios: '/envios',
  privacidad: '/privacidad',
  preguntas: '/faq',
};
