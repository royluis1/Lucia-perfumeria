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
  // Categoría: Florales
  {
    slug: 'eclat-darpege',
    name: "Éclat d'Arpège",
    brand: 'Lanvin',
    description: 'Una fragancia floral fresca y elegante con notas de té verde, hojas de lima y peonía.',
    price: '65.90',
    stock: 10,
    sku: 'TEST-LANVIN-ECLAT',
    weightGrams: 250,
    category: 'Florales',
  },
  {
    slug: 'la-vie-est-belle',
    name: 'La Vie Est Belle',
    brand: 'Lancôme',
    description: 'Fragancia floral gourmand de larga duración con iris, jazmín y vainilla.',
    price: '92.00',
    stock: 6,
    sku: 'TEST-LANCOME-LVEB',
    weightGrams: 350,
    category: 'Florales',
  },
  {
    slug: 'miss-dior',
    name: 'Miss Dior',
    brand: 'Dior',
    description: 'Floral chypre con notas de rosa de Grasse, mandarina y pachulí.',
    price: '105.00',
    stock: 5,
    sku: 'TEST-DIOR-MISS',
    weightGrams: 300,
    category: 'Florales',
  },
  // Categoría: Cítricos / Frescos
  {
    slug: 'light-blue',
    name: 'Light Blue',
    brand: 'Dolce & Gabbana',
    description: 'Aroma cítrico y mediterráneo con limón siciliano, manzana y cedro.',
    price: '79.50',
    stock: 8,
    sku: 'TEST-DG-LIGHTBLUE',
    weightGrams: 300,
    category: 'Cítricos',
  },
  {
    slug: 'acqua-di-gio',
    name: 'Acqua di Giò',
    brand: 'Giorgio Armani',
    description: 'Fragancia acuática fresca con bergamota, jazmín acuático y pachulí.',
    price: '88.00',
    stock: 7,
    sku: 'TEST-ARMANI-ADG',
    weightGrams: 280,
    category: 'Cítricos',
  },
  {
    slug: 'ck-one',
    name: 'CK One',
    brand: 'Calvin Klein',
    description: 'Unisex fresco con bergamota, piña, té verde y almizcle.',
    price: '52.00',
    stock: 12,
    sku: 'TEST-CK-ONE',
    weightGrams: 200,
    category: 'Cítricos',
  },
  // Categoría: Amaderados / Orientales
  {
    slug: 'sauvage',
    name: 'Sauvage',
    brand: 'Dior',
    description: 'Amaderado aromático con bergamota, pimienta de Sichuan y ambroxan.',
    price: '110.00',
    stock: 4,
    sku: 'TEST-DIOR-SAUVAGE',
    weightGrams: 300,
    category: 'Amaderados',
  },
  {
    slug: 'terre-hermes',
    name: 'Terre d\'Hermès',
    brand: 'Hermès',
    description: 'Mineral y amaderado con naranja, sílex, pimienta y vetiver.',
    price: '98.00',
    stock: 5,
    sku: 'TEST-HERMES-TERRE',
    weightGrams: 250,
    category: 'Amaderados',
  },
  {
    slug: 'black-opium',
    name: 'Black Opium',
    brand: 'Yves Saint Laurent',
    description: 'Oriental vainilla con café, flor de azahar, vainilla y cedro.',
    price: '95.00',
    stock: 6,
    sku: 'TEST-YSL-BLACKOPIUM',
    weightGrams: 300,
    category: 'Amaderados',
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
      category: product.category,
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
