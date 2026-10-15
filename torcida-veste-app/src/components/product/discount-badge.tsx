import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function DiscountBadge({
    percent,
    className,
}: {
    percent: number;
    className?: string;
}) {
    return (
        <Badge
            aria-label={`${percent}% de desconto`}
            className={cn(
                'gap-0.5 rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground',
                className,
            )}
        >
            <ChevronDown aria-hidden className="size-3.5" />
            {percent}%
        </Badge>
    );
}
