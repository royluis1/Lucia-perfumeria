'use client';

import { useState } from 'react';
import { AddToCartButton } from './add-to-cart-button';
import { formatPrice } from '../lib/utils';

type ProductPurchaseControlsProps = {
  productId: string;
  productName: string;
  productBrand: string;
  productPrice: number;
  inStock: boolean;
};

export function ProductPurchaseControls({
  productId,
  productName,
  productBrand,
  productPrice,
  inStock,
}: ProductPurchaseControlsProps) {
  const [quantity, setQuantity] = useState(1);

  function changeQuantity(next: number) {
    setQuantity(Math.min(99, Math.max(1, Math.floor(next))));
  }

  function QuantityControl({ mobile = false }: { mobile?: boolean }) {
    return (
      <div className={`flex h-11 items-center border border-line ${mobile ? '' : 'mt-3'}`}>
        <button
          aria-label="Disminuir cantidad"
          className="flex h-11 w-11 items-center justify-center"
          disabled={quantity <= 1}
          onClick={() => changeQuantity(quantity - 1)}
          type="button"
        >
          −
        </button>
        <input
          aria-label="Cantidad"
          className="h-11 w-12 border-x border-line bg-transparent text-center text-base"
          max={99}
          min={1}
          onChange={(event) => {
            const value = Number(event.target.value);
            if (Number.isFinite(value)) changeQuantity(value);
          }}
          type="number"
          value={quantity}
        />
        <button
          aria-label="Aumentar cantidad"
          className="flex h-11 w-11 items-center justify-center"
          disabled={quantity >= 99}
          onClick={() => changeQuantity(quantity + 1)}
          type="button"
        >
          +
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 hidden lg:block">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Cantidad</p>
        <QuantityControl />
        <AddToCartButton
          productId={productId}
          productName={productName}
          productBrand={productBrand}
          productPrice={productPrice}
          quantity={quantity}
          disabled={!inStock}
        />
      </div>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-3 pt-2 shadow-[0_-8px_24px_-20px_rgba(17,17,17,0.5)] backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Cantidad</p>
            <QuantityControl mobile />
          </div>
          <p className="text-sm font-bold">{formatPrice(productPrice)}</p>
        </div>
        <div className="mx-auto max-w-xl pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2">
          <AddToCartButton
            compact
            productId={productId}
            productName={productName}
            productBrand={productBrand}
            productPrice={productPrice}
            quantity={quantity}
            disabled={!inStock}
          />
        </div>
      </div>
    </>
  );
}
