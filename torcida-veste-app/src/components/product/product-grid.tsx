import type { Product } from '@/lib/types';
import { ProductCard } from './product-card';

export function ProductGrid({ products }: { products: Product[] }) {
    return (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 lg:grid-cols-5">
            {products.map((product) => (
                <li key={product.id}>
                    <ProductCard product={product} />
                </li>
            ))}
        </ul>
    );
}
