'use client';

import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from './cart-provider';

export function CartButton() {
    const { totals, setOpen } = useCart();

    return (
        <Button
            variant="outline"
            size="icon"
            aria-label={`Carrinho, ${totals.itemCount} ${totals.itemCount === 1 ? 'item' : 'itens'}`}
            onClick={() => setOpen(true)}
            className="relative border-foreground bg-background"
        >
            <ShoppingCart />
            {totals.itemCount > 0 && (
                <span className="absolute -right-2 -top-2 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold leading-5 text-primary-foreground">
                    {totals.itemCount}
                </span>
            )}
        </Button>
    );
}
