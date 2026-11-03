/* eslint-disable */
// Catálogo (2/2): migra la categoría de texto de cada producto (Product.category) a la
// nueva entidad Category + la tabla ProductCategory. Es idempotente: se puede correr
// varias veces. No modifica Product.category (el string legacy queda igual). No borra nada.
// Los productos con categoría "Uncategorized" quedan sin categoría (se listan al final).
// Uso: node prisma/backfill-categories.cjs
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

function normalizeName(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function slugify(value) {
  return normalizeName(value).replace(/ /g, '-');
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const products = await prisma.product.findMany({
      select: { id: true, slug: true, category: true, categories: { select: { categoryId: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const names = new Map();
    for (const product of products) {
      const trimmed = (product.category ?? '').trim();
      const normalized = normalizeName(trimmed);
      if (!normalized || normalized === 'uncategorized') {
        continue;
      }
      if (!names.has(normalized)) {
        names.set(normalized, trimmed);
      }
    }

    const sorted = [...names.entries()].sort((a, b) => a[1].localeCompare(b[1]));
    const categoryByNormalized = new Map();
    let created = 0;
    let reused = 0;

    for (let index = 0; index < sorted.length; index += 1) {
      const [normalizedName, displayName] = sorted[index];
      const existing = await prisma.category.findUnique({ where: { normalizedName } });
      if (existing) {
        categoryByNormalized.set(normalizedName, existing);
        reused += 1;
        continue;
      }
      const category = await prisma.category.create({
        data: { name: displayName, slug: slugify(displayName), normalizedName, position: index },
      });
      categoryByNormalized.set(normalizedName, category);
      created += 1;
    }

    let linked = 0;
    let skippedWithCategories = 0;
    const withoutCategory = [];

    for (const product of products) {
      const normalized = normalizeName((product.category ?? '').trim());
      const category = categoryByNormalized.get(normalized);
      if (!category) {
        withoutCategory.push(product.slug);
        continue;
      }
      if (product.categories.length > 0) {
        skippedWithCategories += 1;
        continue;
      }
      await prisma.productCategory.create({
        data: { productId: product.id, categoryId: category.id, position: 0 },
      });
      linked += 1;
    }

    console.log(
      `categorías creadas: ${created}; ya existían: ${reused}; productos vinculados: ${linked}; ya tenían categorías: ${skippedWithCategories}; sin categoría (Uncategorized o vacío): ${withoutCategory.length}`,
    );
    if (withoutCategory.length > 0) {
      console.log(`sin categoría: ${withoutCategory.join(', ')}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Error migrando categorías:', error);
  process.exit(1);
});
