'use client';

import { CreditCard, Lock } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useSyncExternalStore } from 'react';
import { CartSummary } from '@/components/cart/cart-summary';
import { updateCart } from '@/components/cart/cart-store';
import { useCart } from '@/components/cart/cart-provider';
import { CouponField } from '@/components/cart/coupon-field';
import { TitlePill } from '@/components/common/title-pill';
import { Price } from '@/components/product/price';
import { Button } from '@/components/ui/button';
import { buildOrderRequest, CHECKOUT_ERROR, describeIssues, interpretOrderResponse } from '@/lib/checkout';
import { reconcileCart } from '@/lib/reconcile';

const noopSubscribe = () => () => {};

export function CheckoutView() {
    const { cart, totals, removeCoupon } = useCart();
    const router = useRouter();
    const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
    const [submitting, setSubmitting] = useState(false);
    const [problems, setProblems] = useState<string[]>([]);

    const pay = async () => {
        setSubmitting(true);
        setProblems([]);

        try {
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(buildOrderRequest(cart)),
            });
            const body: unknown = await response.json().catch(() => null);
            const outcome = interpretOrderResponse(response, body);

            switch (outcome.kind) {
                case 'redirect':
                    window.location.assign(outcome.url);
                    return;
                case 'outdated':
                    setProblems(describeIssues(cart, outcome.issues));
                    updateCart((current) => reconcileCart(current, outcome.issues));
                    break;
                case 'invalid-coupon':
                    removeCoupon();
                    setProblems(['Cupom inválido ou expirado. Ele foi removido do pedido.']);
                    break;
                case 'unauthorized':
                    router.replace('/entrar?next=%2Fcheckout');
                    return;
                default:
                    setProblems([CHECKOUT_ERROR]);
            }
        } catch {
            setProblems([CHECKOUT_ERROR]);
        }
        setSubmitting(false);
    };

    const empty = cart.items.length === 0;

    return (
        <div className="mx-auto w-full max-w-[720px] px-4 py-8 md:px-10">
            <TitlePill icon={<CreditCard aria-hidden className="size-5" />}>Finalizar compra</TitlePill>

            {!hydrated ? null : empty ? (
                <div className="space-y-4 py-16 text-center text-sm text-muted-foreground">
                    <p>Seu carrinho está vazio.</p>
                    <Button asChild variant="outline" className="border-foreground bg-transparent">
                        <Link href="/produtos">Ver produtos</Link>
                    </Button>
                </div>
            ) : (
                <div className="mt-8 space-y-6">
                    <ul className="space-y-5">
                        {cart.items.map((item) => (
                            <li key={item.productId} className="flex gap-4">
                                <div className="relative size-[91px] shrink-0 overflow-hidden rounded-lg bg-card">
                                    {item.image && (
                                        <Image src={item.image} alt={item.name} fill sizes="91px" className="object-contain p-2" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1 space-y-1">
                                    <p className="text-sm">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">Quantidade: {item.quantity}</p>
                                    <Price
                                        price={item.price}
                                        originalPrice={item.originalPrice}
                                        className="[&>span:first-child]:text-base"
                                    />
                                </div>
                            </li>
                        ))}
                    </ul>

                    <div>
                        <CouponField />
                        <CartSummary totals={totals} />
                    </div>

                    {problems.length > 0 && (
                        <div role="alert" className="space-y-1 rounded-lg border border-destructive p-4 text-sm text-destructive">
                            {problems.map((problem) => (
                                <p key={problem}>{problem}</p>
                            ))}
                        </div>
                    )}

                    <div className="space-y-3">
                        <Button
                            type="button"
                            onClick={pay}
                            disabled={submitting}
                            className="h-12 w-full bg-primary font-extrabold uppercase text-primary-foreground hover:bg-primary/90"
                        >
                            {submitting ? 'Processando…' : 'Pagar com cartão'}
                        </Button>
                        <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                            <Lock aria-hidden className="size-3.5" />
                            Pagamento seguro no Stripe · ambiente de testes
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
