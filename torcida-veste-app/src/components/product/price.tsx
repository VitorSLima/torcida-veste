import { formatBRL } from '@/lib/format';
import { cn } from '@/lib/utils';

export function Price({
    price,
    originalPrice,
    className,
}: {
    price: number;
    originalPrice: number | null;
    className?: string;
}) {
    const onSale = originalPrice != null && originalPrice > price;

    return (
        <p className={cn('flex flex-wrap items-baseline gap-x-2', className)}>
            <span className="text-lg font-bold">{formatBRL(price)}</span>
            {onSale && (
                <span className="text-xs text-muted-foreground line-through">
                    {formatBRL(originalPrice)}
                </span>
            )}
        </p>
    );
}
