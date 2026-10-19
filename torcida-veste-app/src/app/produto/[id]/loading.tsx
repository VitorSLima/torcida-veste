import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="mx-auto grid w-full max-w-[1300px] gap-6 px-4 py-6 md:grid-cols-[1.5fr_1fr] md:px-10 md:py-12">
            <Skeleton className="aspect-square rounded-xl bg-card md:aspect-[4/3]" />
            <Skeleton className="h-96 rounded-xl bg-card" />
        </div>
    );
}
