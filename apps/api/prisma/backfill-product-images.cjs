/* eslint-disable */
// Migra la imagen actual de cada producto (Product.imageUrl) a la tabla ProductImage
// como imagen en posición 0. Es idempotente: no toca productos que ya tienen imágenes.
// Uso: node prisma/backfill-product-images.cjs
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    const products = await prisma.product.findMany({
      where: { imageUrl: { not: null } },
      select: { id: true, name: true, brand: true, imageUrl: true, images: { select: { id: true } } },
    });

    let created = 0;
    let skipped = 0;
    for (const product of products) {
      if (product.images.length > 0) {
        skipped += 1;
        continue;
      }
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: product.imageUrl,
          position: 0,
          alt: `${product.name} — ${product.brand}`,
        },
      });
      created += 1;
    }

    console.log(`imágenes migradas: ${created}; ya tenían imágenes: ${skipped}; sin imagen: ${await prisma.product.count({ where: { imageUrl: null } })}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('Error migrando imágenes:', error);
  process.exit(1);
});
