import Link from 'next/link';
import type { Product } from '../lib/api';

export function ProductCard({ product }: { product: Product }) {
  const price = Number(product.price).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  });

  return (
    <article>
      <Link href={`/shop/${product.slug}`} className="group block">
        <div className="flex aspect-[4/5] items-end justify-center bg-white p-10 transition group-hover:bg-gold-soft">
          <div className="h-52 w-28 bg-gradient-to-b from-white to-black/10 shadow-xl transition group-hover:-translate-y-2" />
        </div>
        <div className="flex justify-between gap-4 pt-5">
          <div>
            <h2 className="font-semibold">{product.name}</h2>
            <p className="mt-1 text-sm text-black/55">{product.brand}</p>
          </div>
          <p className="text-sm font-semibold">{price}</p>
        </div>
      </Link>
    </article>
  );
}
