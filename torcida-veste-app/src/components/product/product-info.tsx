'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { Product } from '@/lib/types';
import { DiscountBadge } from './discount-badge';
import { QuantityStepper } from './quantity-stepper';
import { RatingStars } from './rating-stars';
import { formatBRL } from '@/lib/format';

export function ProductInfo({ product }: { product: Product }) {
    const [quantity, setQuantity] = useState(1);
    const inStock = product.stock_status === 'IN_STOCK';

    return (
        <div className="flex flex-col gap-5 rounded-xl bg-card p-6 md:p-10">
            <div className="space-y-1">
                <h1 className="text-2xl font-normal md:text-3xl">{product.name}</h1>
                <p className={inStock ? 'text-sm text-primary' : 'text-sm text-muted-foreground'}>
                    {inStock ? 'Disponível em estoque' : 'Indisponível no momento'}
                </p>
                <RatingStars />
            </div>

            <div className="mt-4 space-y-1">
                <p className="flex flex-wrap items-center gap-3">
                    <span className="text-3xl font-bold">{formatBRL(product.price)}</span>
                    {product.discountPercent ? (
                        <DiscountBadge percent={product.discountPercent} className="text-sm" />
                    ) : null}
                </p>
                {product.isOnSale && product.originalPrice != null && (
                    <p className="text-sm text-muted-foreground">
                        De: <span className="line-through">{formatBRL(product.originalPrice)}</span>
                    </p>
                )}
            </div>

            <QuantityStepper value={quantity} onChange={setQuantity} />

            <section className="mt-4">
                <h2 className="mb-2 font-bold">Descrição</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {product.description}
                </p>
                <p className="mt-3 text-sm text-muted-foreground">Tamanhos: {product.size}</p>
            </section>

            <Button
                type="button"
                size="lg"
                disabled={!inStock}
                className="mt-4 h-12 w-full bg-primary font-extrabold uppercase text-primary-foreground hover:bg-primary/90"
            >
                Adicionar ao carrinho
            </Button>
        </div>
    );
}
