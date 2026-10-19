import { Skeleton } from '@/components/ui/skeleton';

export function ProductGridSkeleton({ count = 10 }: { count?: number }) {
    return (
        <ul
            aria-hidden
            className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 lg:grid-cols-5"
        >
            {Array.from({ length: count }, (_, index) => (
                <li key={index}>
                    <Skeleton className="aspect-[4/5] w-full rounded-xl bg-card" />
                </li>
            ))}
        </ul>
    );
}
