'use client';

import { CircleCheck, CircleX, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from '@/components/cart/cart-provider';
import { Button } from '@/components/ui/button';
import { formatOrderNumber } from '@/lib/order-labels';
import { nextPollState, POLL_INTERVAL_MS, type PollState } from '@/lib/order-poll';
import type { Order } from '@/lib/order-types';

type View = { state: PollState | 'invalid'; number?: number };

const VALID_ID = /^[\w-]{1,64}$/;

async function fetchOrder(id: string, signal: AbortSignal): Promise<{ order: Order | null; gone: boolean }> {
    try {
        const response = await fetch(`/api/orders/${encodeURIComponent(id)}`, { signal, cache: 'no-store' });
        if (response.status === 404 || response.status === 401) return { order: null, gone: true };
        if (!response.ok) return { order: null, gone: false };
        return { order: (await response.json()) as Order, gone: false };
    } catch {
        return { order: null, gone: false };
    }
}

export function OrderPoller({ orderId }: { orderId: string }) {
    const { clear } = useCart();
    const valid = VALID_ID.test(orderId);
    const [view, setView] = useState<View>({ state: 'pending' });

    useEffect(() => {
        clear();
    }, [clear]);

    useEffect(() => {
        if (!valid) return;
        let active = true;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const controller = new AbortController();

        const poll = (attempt: number) => {
            fetchOrder(orderId, controller.signal).then(({ order, gone }) => {
                if (!active) return;
                if (gone) {
                    setView({ state: 'invalid' });
                    return;
                }
                const state = nextPollState(order, attempt);
                setView({ state, number: order?.number });
                if (state === 'pending') timer = setTimeout(() => poll(attempt + 1), POLL_INTERVAL_MS);
            });
        };
        poll(1);

        return () => {
            active = false;
            clearTimeout(timer);
            controller.abort();
        };
    }, [orderId, valid]);

    const state = valid ? view.state : 'invalid';
    const orders = (
        <Button asChild variant="outline" className="h-12 border-foreground bg-transparent font-extrabold uppercase">
            <Link href="/pedidos">Ver meus pedidos</Link>
        </Button>
    );

    return (
        <div className="mx-auto w-full max-w-md px-4 py-10 md:py-16">
            <div className="space-y-6 rounded-xl bg-card p-6 text-center md:p-10" aria-live="polite">
                {state === 'pending' && (
                    <>
                        <Loader2 aria-hidden className="mx-auto size-10 animate-spin text-primary" />
                        <h1 className="text-xl font-extrabold">Confirmando seu pagamento…</h1>
                        <p className="text-sm text-muted-foreground">
                            Isso leva poucos segundos. Não feche esta página.
                        </p>
                    </>
                )}
                {state === 'paid' && (
                    <>
                        <CircleCheck aria-hidden className="mx-auto size-10 text-primary" />
                        <h1 className="text-xl font-extrabold">
                            Pagamento confirmado!{view.number != null && ` Pedido ${formatOrderNumber(view.number)}`}
                        </h1>
                        <div className="flex flex-col gap-3">
                            <Button asChild className="h-12 bg-primary font-extrabold uppercase text-primary-foreground hover:bg-primary/90">
                                <Link href="/produtos">Continuar comprando</Link>
                            </Button>
                            {orders}
                        </div>
                    </>
                )}
                {state === 'exhausted' && (
                    <>
                        <Clock aria-hidden className="mx-auto size-10 text-primary" />
                        <h1 className="text-xl font-extrabold">
                            Recebemos seu pedido; a confirmação pode levar alguns instantes
                        </h1>
                        {orders}
                    </>
                )}
                {state === 'canceled' && (
                    <>
                        <CircleX aria-hidden className="mx-auto size-10 text-destructive" />
                        <h1 className="text-xl font-extrabold">Pagamento não concluído</h1>
                        <div className="flex flex-col gap-3">
                            <Button asChild className="h-12 bg-primary font-extrabold uppercase text-primary-foreground hover:bg-primary/90">
                                <Link href="/produtos">Continuar comprando</Link>
                            </Button>
                            {orders}
                        </div>
                    </>
                )}
                {state === 'invalid' && (
                    <>
                        <h1 className="text-xl font-extrabold">Não encontramos este pedido</h1>
                        <p className="text-sm text-muted-foreground">Confira o andamento dos seus pedidos na lista abaixo.</p>
                        {orders}
                    </>
                )}
            </div>
        </div>
    );
}
