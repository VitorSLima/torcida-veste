'use client';

import { Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Price } from '@/components/product/price';
import { QuantityStepper } from '@/components/product/quantity-stepper';
import type { CartItem } from '@/lib/cart';
import { useCart } from './cart-provider';

export function CartLine({ item }: { item: CartItem }) {
    const { setQty, remove, setOpen } = useCart();

    return (
        <li className="flex gap-4">
            <Link
                href={`/produto/${item.productId}`}
                onClick={() => setOpen(false)}
                className="relative size-[91px] shrink-0 overflow-hidden rounded-lg bg-card"
            >
                {item.image && <Image src={item.image} alt={item.name} fill sizes="91px" className="object-contain p-2" />}
            </Link>
            <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-sm">{item.name}</p>
                <Price price={item.price} originalPrice={item.originalPrice} className="[&>span:first-child]:text-base" />
                <QuantityStepper value={item.quantity} onChange={(next) => setQty(item.productId, next)} />
            </div>
            <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={`Remover ${item.name}`}
                onClick={() => remove(item.productId)}
                className="self-center border-foreground bg-transparent"
            >
                <Trash2 />
            </Button>
        </li>
    );
}
