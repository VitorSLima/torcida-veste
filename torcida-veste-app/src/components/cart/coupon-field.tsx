'use client';

import { Tag } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatBRL } from '@/lib/format';
import { useCart } from './cart-provider';

export function CouponField() {
    const { couponCode, couponDiscount, couponError, applyCoupon, removeCoupon } = useCart();
    const [draft, setDraft] = useState('');

    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        if (!draft.trim()) return;
        applyCoupon(draft);
        setDraft('');
    };

    return (
        <div className="space-y-2 border-t border-border py-3">
            {couponCode ? (
                <div className="flex h-10 items-center justify-between gap-2 rounded-lg border border-primary px-3 text-sm">
                    <span className="flex min-w-0 items-center gap-2 font-bold">
                        <Tag aria-hidden className="size-4 shrink-0 text-primary" />
                        <span className="truncate">
                            {couponCode.toUpperCase()} · - {formatBRL(couponDiscount)}
                        </span>
                    </span>
                    <Button type="button" variant="ghost" size="sm" onClick={removeCoupon} className="h-8 px-2 text-xs">
                        Remover
                    </Button>
                </div>
            ) : (
                <form onSubmit={submit} className="flex gap-2">
                    <Input
                        aria-label="Cupom de desconto"
                        placeholder="Cupom de desconto"
                        value={draft}
                        onChange={(event) => setDraft(event.target.value)}
                        autoComplete="off"
                        className="h-10"
                    />
                    <Button type="submit" variant="outline" className="h-10 border-primary px-4 font-bold text-primary">
                        Aplicar
                    </Button>
                </form>
            )}
            {couponError && (
                <p role="alert" className="text-sm text-destructive">
                    {couponError}
                </p>
            )}
        </div>
    );
}
