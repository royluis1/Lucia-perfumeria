/* eslint-disable */
// Catálogo (1/2): migra la marca de texto de cada producto (Product.brand) a la nueva
// entidad Brand y vincula Product.brandId. Es idempotente: se puede correr varias veces.
// No modifica Product.brand (el string legacy queda igual). No borra nada.
// Uso: node prisma/backfill-brands.cjs
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
      select: { id: true, brand: true },
      orderBy: { createdAt: 'asc' },
    });

    const groups = new Map();
    for (const product of products) {
      const trimmed = (product.brand ?? '').trim();
      if (!trimmed) {
        continue;
      }
      const normalized = normalizeName(trimmed);
      if (!normalized) {
        continue;
      }
      if (!groups.has(normalized)) {
        groups.set(normalized, { variants: new Map(), productIds: [] });
      }
      const group = groups.get(normalized);
      group.productIds.push(product.id);
      group.variants.set(trimmed, (group.variants.get(trimmed) ?? 0) + 1);
    }

    let created = 0;
    let reused = 0;
    let linked = 0;

    for (const [normalizedName, group] of groups) {
      const displayName = [...group.variants.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];

      const existing = await prisma.brand.findUnique({ where: { normalizedName } });
      let brand = existing;
      if (!brand) {
        brand = await prisma.brand.create({
          data: { name: displayName, slug: slugify(displayName), normalizedName },
        });
        created += 1;
      } else {
        reused += 1;
      }

      const result = await prisma.product.updateMany({
        where: { id: { in: group.productIds }, OR: [{ brandId: null }, { brandId: { not: brand.id } }] },
        data: { brandId: brand.id },
      });
      linked += result.count;
    }

    const unlinked = await prisma.product.count({ where: { brandId: null } });
    console.log(
      `marcas creadas: ${created}; ya existían: ${reused}; productos vinculados: ${linked}; productos sin marca vinculada: ${unlinked}`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Error migrando marcas:', error);
  process.exit(1);
});
