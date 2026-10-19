'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Order } from '@/lib/order-types';
import { OrderCard } from './order-card';

type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; orders: Order[] };

export function OrdersList() {
    const router = useRouter();
    const [state, setState] = useState<State>({ kind: 'loading' });
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        const controller = new AbortController();

        fetch('/api/orders', { cache: 'no-store', signal: controller.signal })
            .then(async (response) => {
                if (response.status === 401) {
                    router.replace('/entrar?next=%2Fpedidos');
                    return;
                }
                if (!response.ok) {
                    setState({ kind: 'error' });
                    return;
                }
                setState({ kind: 'ready', orders: (await response.json()) as Order[] });
            })
            .catch((error: unknown) => {
                if (error instanceof DOMException && error.name === 'AbortError') return;
                setState({ kind: 'error' });
            });

        return () => controller.abort();
    }, [attempt, router]);

    const retry = useCallback(() => {
        setState({ kind: 'loading' });
        setAttempt((current) => current + 1);
    }, []);

    if (state.kind === 'loading') {
        return (
            <div className="mt-8 space-y-4" aria-busy="true">
                {[0, 1, 2].map((key) => (
                    <Skeleton key={key} className="h-28 w-full rounded-xl" />
                ))}
            </div>
        );
    }

    if (state.kind === 'error') {
        return (
            <div role="alert" className="space-y-4 py-16 text-center text-sm text-muted-foreground">
                <p>Não foi possível carregar seus pedidos.</p>
                <Button type="button" variant="outline" onClick={retry} className="border-foreground bg-transparent">
                    Tentar novamente
                </Button>
            </div>
        );
    }

    if (state.orders.length === 0) {
        return (
            <div className="space-y-4 py-16 text-center text-sm text-muted-foreground">
                <p>Você ainda não fez nenhum pedido.</p>
                <Button asChild variant="outline" className="border-foreground bg-transparent">
                    <Link href="/produtos">Ver produtos</Link>
                </Button>
            </div>
        );
    }

    return (
        <ul className="mt-8 space-y-4">
            {state.orders.map((order, index) => (
                <li key={order.id}>
                    <OrderCard order={order} defaultOpen={index === 0} />
                </li>
            ))}
        </ul>
    );
}
