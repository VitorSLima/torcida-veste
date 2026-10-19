import Link from 'next/link';
import type { Product } from '@/lib/types';
import { ProductCard } from './product-card';

export function ProductSection({
    title,
    products,
    href,
}: {
    title: string;
    products: Product[];
    href?: string;
}) {
    if (products.length === 0) return null;

    return (
        <section aria-label={title}>
            <div className="mb-4 flex items-baseline justify-between">
                <h2 className="text-lg font-extrabold uppercase">{title}</h2>
                {href && (
                    <Link href={href} className="text-sm text-primary hover:underline">
                        Ver todos
                    </Link>
                )}
            </div>
            <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-5 md:gap-6 md:overflow-visible md:px-0">
                {products.map((product) => (
                    <li key={product.id} className="w-[44%] shrink-0 snap-start md:w-auto">
                        <ProductCard product={product} />
                    </li>
                ))}
            </ul>
        </section>
    );
}
