import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductGallery } from '@/components/product/product-gallery';
import { ProductInfo } from '@/components/product/product-info';
import { getProduct } from '@/lib/api';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    const product = await getProduct(id);
    return { title: product?.name ?? 'Produto' };
}

export default async function ProductPage({ params }: Props) {
    const { id } = await params;
    const product = await getProduct(id);

    if (!product) notFound();

    return (
        <div className="mx-auto grid w-full max-w-[1300px] items-start gap-6 px-4 py-6 md:grid-cols-[1.5fr_1fr] md:px-10 md:py-12">
            <ProductGallery images={product.Images} name={product.name} />
            <ProductInfo product={product} />
        </div>
    );
}
