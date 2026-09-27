import Link from 'next/link';
import { AddToCartButton } from './add-to-cart-button';
import type { Product } from '../lib/api';

export function ProductCard({ product }: { product: Product }) {
  const priceValue = Number(product.price);

  return (
    <article>
      <Link href={`/shop/${product.slug}`} className="group block">
        <div className="relative flex aspect-[4/5] items-end justify-center overflow-hidden bg-white p-10 transition group-hover:bg-gold-soft">
          {product.imageUrl ? (
            <img
              className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
              src={product.imageUrl}
              alt={product.name}
            />
          ) : (
            <div className="h-52 w-28 bg-gradient-to-b from-white to-black/10 shadow-xl transition group-hover:-translate-y-2" />
          )}
        </div>
        <div className="flex justify-between gap-4 pt-5">
          <div>
            <h2 className="font-semibold">{product.name}</h2>
            <p className="mt-1 text-sm text-black/55">{product.brand}</p>
          </div>
          <p className="text-sm font-semibold">{priceValue.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })}</p>
        </div>
      </Link>
      <AddToCartButton
        productId={product.id}
        productName={product.name}
        productBrand={product.brand}
        productPrice={priceValue}
      />
    </article>
  );
}
