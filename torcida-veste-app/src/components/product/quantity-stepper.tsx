'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { clampQuantity, MAX_QUANTITY } from '@/lib/quantity';

export function QuantityStepper({
    value,
    onChange,
}: {
    value: number;
    onChange: (next: number) => void;
}) {
    return (
        <div className="flex items-center gap-3">
            <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Diminuir quantidade"
                disabled={value <= 1}
                onClick={() => onChange(clampQuantity(value - 1))}
                className="border-foreground bg-transparent"
            >
                <ChevronLeft />
            </Button>
            <output aria-live="polite" className="w-6 text-center text-sm">
                {value}
            </output>
            <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Aumentar quantidade"
                disabled={value >= MAX_QUANTITY}
                onClick={() => onChange(clampQuantity(value + 1))}
                className="border-foreground bg-transparent"
            >
                <ChevronRight />
            </Button>
        </div>
    );
}
