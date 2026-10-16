'use client';

import { ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { useId, useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatBRL } from '@/lib/format';
import { formatOrderDate, formatOrderNumber, statusLabel, statusTone, type StatusTone } from '@/lib/order-labels';
import type { Order } from '@/lib/order-types';

const TONE: Record<StatusTone, string> = {
    success: 'text-primary',
    warning: 'text-yellow-400',
    danger: 'text-destructive',
};

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={className}>
            <dt className="text-sm font-extrabold uppercase">{label}</dt>
            <dd className="mt-1 text-sm text-muted-foreground">{children}</dd>
        </div>
    );
}

export function OrderCard({ order, defaultOpen = false }: { order: Order; defaultOpen?: boolean }) {
    const [open, setOpen] = useState(defaultOpen);
    const panelId = useId();

    const row = (label: string, value: string, strong = false) => (
        <div className={`flex items-center justify-between border-t border-border py-3 text-sm ${strong ? 'font-bold' : ''}`}>
            <dt>{label}</dt>
            <dd>{value}</dd>
        </div>
    );

    return (
        <article className="rounded-xl border border-border p-4 md:p-6">
            <dl className="grid grid-cols-2 items-center gap-4 md:grid-cols-5">
                <Field label="Número do pedido">{formatOrderNumber(order.number)}</Field>
                <Field label="Status">
                    <span className={`font-bold ${TONE[statusTone(order.status)]}`}>{statusLabel(order.status)}</span>
                </Field>
                <Field label="Data">{formatOrderDate(order.createdAt)}</Field>
                <Field label="Pagamento">Cartão</Field>
                <div className="col-span-2 md:col-span-1 md:justify-self-end">
                    <button
                        type="button"
                        aria-expanded={open}
                        aria-controls={panelId}
                        onClick={() => setOpen((current) => !current)}
                        className="inline-flex items-center gap-2 text-sm font-bold text-primary"
                    >
                        <ChevronDown aria-hidden className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} />
                        Detalhes do Pedido
                    </button>
                </div>
            </dl>

            {open && (
                <div id={panelId} className="mt-6 space-y-6 border-t border-border pt-6">
                    <ul className="space-y-5">
                        {order.items.map((item) => (
                            <li key={item.productId} className="flex gap-4">
                                <div className="relative size-[91px] shrink-0 overflow-hidden rounded-lg bg-card">
                                    {item.image && (
                                        <Image src={item.image} alt={item.name} fill sizes="91px" className="object-contain p-2" />
                                    )}
                                </div>
                                <div className="min-w-0 flex-1 space-y-1">
                                    <p className="inline-block rounded bg-card px-2 py-1 text-xs">
                                        Vendido e entregue por: <strong>Torcida Veste</strong>
                                    </p>
                                    <p className="text-sm">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">Quantidade: {item.quantity}</p>
                                </div>
                                <div className="shrink-0 text-right">
                                    <p className="text-lg font-extrabold">{formatBRL(item.unitPrice)}</p>
                                    {item.originalPrice != null && item.originalPrice > item.unitPrice && (
                                        <p className="text-xs text-muted-foreground">
                                            De: <span className="line-through">{formatBRL(item.originalPrice)}</span>
                                        </p>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>

                    <dl>
                        {row('Subtotal', formatBRL(order.subtotal))}
                        {row('Entrega', order.shipping === 0 ? 'Grátis' : formatBRL(order.shipping))}
                        {row('Descontos', order.discount > 0 ? `- ${formatBRL(order.discount)}` : formatBRL(0))}
                        {row('Total', formatBRL(order.total), true)}
                    </dl>

                    {order.status === 'PENDING_PAYMENT' && order.paymentUrl && (
                        <Button asChild className="h-12 w-full bg-primary font-extrabold uppercase text-primary-foreground hover:bg-primary/90">
                            <a href={order.paymentUrl}>Pagar agora</a>
                        </Button>
                    )}
                </div>
            )}
        </article>
    );
}
