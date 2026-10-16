'use client';

import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useSession } from '@/components/auth/session-provider';
import { formatBRL } from '@/lib/format';
import { CartLine } from './cart-line';
import { useCart } from './cart-provider';

const CHECKOUT = '/checkout';

export function CartDrawer() {
    const { cart, totals, open, setOpen } = useCart();
    const { user } = useSession();
    const empty = cart.items.length === 0;
    const href = user ? CHECKOUT : `/entrar?next=${encodeURIComponent(CHECKOUT)}`;

    const row = (label: string, value: string, strong = false) => (
        <div className={`flex items-center justify-between border-t border-border py-3 text-sm ${strong ? 'font-bold' : ''}`}>
            <dt>{label}</dt>
            <dd>{value}</dd>
        </div>
    );

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="right" className="gap-0 border-border bg-background p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-[430px]">
                <SheetHeader className="p-6 pb-4">
                    <SheetTitle className="inline-flex w-fit items-center gap-2 rounded-full border-2 border-primary px-4 py-1.5 text-base font-extrabold uppercase">
                        <ShoppingCart aria-hidden className="size-5" />
                        Carrinho
                    </SheetTitle>
                    <SheetDescription className="sr-only">Itens do seu carrinho</SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6">
                    {empty ? (
                        <div className="space-y-4 py-10 text-center text-sm text-muted-foreground">
                            <p>Seu carrinho está vazio.</p>
                            <Button asChild variant="outline" className="border-foreground bg-transparent" onClick={() => setOpen(false)}>
                                <Link href="/produtos">Ver produtos</Link>
                            </Button>
                        </div>
                    ) : (
                        <>
                            <ul className="space-y-5 pb-6">
                                {cart.items.map((item) => (
                                    <CartLine key={item.productId} item={item} />
                                ))}
                            </ul>
                            <dl>
                                {row('Subtotal', formatBRL(totals.subtotal))}
                                {row('Entrega', totals.shipping === 0 ? 'Grátis' : formatBRL(totals.shipping))}
                                {row('Descontos', totals.savings > 0 ? `- ${formatBRL(totals.savings)}` : formatBRL(0))}
                                {row('Total', formatBRL(totals.total), true)}
                            </dl>
                        </>
                    )}
                </div>

                <div className="p-6">
                    {empty ? (
                        <Button disabled className="h-12 w-full font-extrabold uppercase">Finalizar compra</Button>
                    ) : (
                        <Button asChild className="h-12 w-full bg-primary font-extrabold uppercase text-primary-foreground hover:bg-primary/90">
                            <Link href={href} onClick={() => setOpen(false)}>Finalizar compra</Link>
                        </Button>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
