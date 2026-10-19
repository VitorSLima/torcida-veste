'use client';

import { useRouter } from 'next/navigation';
import { useCart } from '@/components/cart/cart-provider';
import { Button } from '@/components/ui/button';

export function BackToCartButton() {
    const { setOpen } = useCart();
    const router = useRouter();

    return (
        <Button
            type="button"
            onClick={() => {
                setOpen(true);
                router.push('/');
            }}
            className="h-12 bg-primary font-extrabold uppercase text-primary-foreground hover:bg-primary/90"
        >
            Voltar ao carrinho
        </Button>
    );
}
