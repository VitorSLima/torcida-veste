'use client';

import { formatBRL } from '@/lib/format';
import type { cartTotals } from '@/lib/cart';

type Props = { totals: ReturnType<typeof cartTotals> };

export function CartSummary({ totals }: Props) {
    const row = (label: string, value: string, strong = false) => (
        <div className={`flex items-center justify-between border-t border-border py-3 text-sm ${strong ? 'font-bold' : ''}`}>
            <dt>{label}</dt>
            <dd>{value}</dd>
        </div>
    );

    return (
        <dl>
            {row('Subtotal', formatBRL(totals.subtotal))}
            {row('Entrega', totals.shipping === 0 ? 'Grátis' : formatBRL(totals.shipping))}
            {row('Descontos', totals.discounts > 0 ? `- ${formatBRL(totals.discounts)}` : formatBRL(0))}
            {row('Total', formatBRL(totals.total), true)}
        </dl>
    );
}
