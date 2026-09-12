const fs = require('node:fs');
const path = require('node:path');

if (!process.env.DATABASE_URL) {
  const envPath = path.join(__dirname, '..', '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const databaseLine = envContent
    .split(/\r?\n/)
    .find((line) => line.startsWith('DATABASE_URL='));
  if (databaseLine) {
    process.env.DATABASE_URL = databaseLine
      .slice('DATABASE_URL='.length)
      .trim()
      .replace(/^(['"])(.*)\1$/, '$2');
  }
}

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const products = [
  {
    slug: 'eclat-darpege',
    name: "Éclat d'Arpège",
    brand: 'Lanvin',
    description: 'Una fragancia floral fresca y elegante.',
    price: '65.90',
    stock: 10,
    sku: 'TEST-LANVIN-ECLAT',
    weightGrams: 250,
  },
  {
    slug: 'light-blue',
    name: 'Light Blue',
    brand: 'Dolce & Gabbana',
    description: 'Aroma cítrico y mediterráneo.',
    price: '79.50',
    stock: 8,
    sku: 'TEST-DG-LIGHTBLUE',
    weightGrams: 300,
  },
  {
    slug: 'la-vie-est-belle',
    name: 'La Vie Est Belle',
    brand: 'Lancôme',
    description: 'Fragancia floral gourmand de larga duración.',
    price: '92.00',
    stock: 6,
    sku: 'TEST-LANCOME-LVEB',
    weightGrams: 350,
  },
];

async function main() {
  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        brand: product.brand,
        description: product.description,
        price: product.price,
        stock: product.stock,
        weightGrams: product.weightGrams,
        isActive: true,
      },
      create: product,
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exitCode = 1;
  });
