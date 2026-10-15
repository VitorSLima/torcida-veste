import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { DiscountBadge } from './discount-badge';
import { Price } from './price';

export function ProductCard({ product }: { product: Product }) {
    const cover = product.Images.find((image) => image.is_Cover) ?? product.Images[0];

    return (
        <Link
            href={`/produto/${product.id}`}
            className="group relative flex h-full flex-col rounded-xl bg-card p-2 outline-none transition-shadow hover:ring-2 hover:ring-primary/60 focus-visible:ring-2 focus-visible:ring-primary"
        >
            {product.discountPercent ? (
                <DiscountBadge
                    percent={product.discountPercent}
                    className="absolute left-3 top-3 z-10"
                />
            ) : null}

            <div className="relative aspect-square">
                {cover && (
                    <Image
                        src={cover.url}
                        alt={product.name}
                        fill
                        sizes="(min-width: 768px) 20vw, 50vw"
                        className="object-contain p-4 transition-transform group-hover:scale-105"
                    />
                )}
            </div>

            <div className="px-1 pb-2 pt-3">
                <h3 className="line-clamp-2 min-h-10 text-sm">{product.name}</h3>
                <Price price={product.price} originalPrice={product.originalPrice} />
            </div>
        </Link>
    );
}
