import { Skeleton } from '@/components/ui/skeleton';
import { ProductGridSkeleton } from '@/components/product/product-grid-skeleton';

export default function Loading() {
    return (
        <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-10">
            <Skeleton className="h-11 w-44 rounded-full bg-card" />
            <div className="mt-6">
                <ProductGridSkeleton />
            </div>
        </div>
    );
}
