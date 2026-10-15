'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { ProductImage } from '@/lib/types';
import { cn } from '@/lib/utils';

export function ProductGallery({
    images,
    name,
}: {
    images: ProductImage[];
    name: string;
}) {
    const [selected, setSelected] = useState(0);
    const current = images[selected] ?? images[0];

    if (!current) {
        return <div className="aspect-square rounded-xl bg-card" />;
    }

    return (
        <div className="flex flex-col-reverse gap-4 rounded-xl bg-card p-4 md:flex-row md:gap-6 md:p-10">
            {images.length > 1 && (
                <ul className="flex gap-3 md:flex-col">
                    {images.map((image, index) => (
                        <li key={image.id}>
                            <button
                                type="button"
                                aria-label={`Ver imagem ${index + 1} de ${images.length}`}
                                aria-pressed={index === selected}
                                onClick={() => setSelected(index)}
                                className={cn(
                                    'relative size-16 overflow-hidden rounded-lg border-2 bg-background outline-none md:size-[77px]',
                                    index === selected ? 'border-primary' : 'border-transparent',
                                    'focus-visible:ring-2 focus-visible:ring-primary',
                                )}
                            >
                                <Image
                                    src={image.url}
                                    alt=""
                                    fill
                                    sizes="80px"
                                    className="object-contain p-1.5"
                                />
                            </button>
                        </li>
                    ))}
                </ul>
            )}
            <div className="relative aspect-square flex-1">
                <Image
                    src={current.url}
                    alt={name}
                    fill
                    priority
                    sizes="(min-width: 768px) 45vw, 90vw"
                    className="object-contain"
                />
            </div>
        </div>
    );
}
