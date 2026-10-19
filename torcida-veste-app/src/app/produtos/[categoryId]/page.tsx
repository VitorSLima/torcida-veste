import { LayoutGrid } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TitlePill } from '@/components/common/title-pill';
import { Pagination } from '@/components/product/pagination';
import { ProductGrid } from '@/components/product/product-grid';
import { getCategories, getProducts } from '@/lib/api';
import { parsePage } from '@/lib/products-query';

type Props = {
    params: Promise<{ categoryId: string }>;
    searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { categoryId } = await params;
    const category = (await getCategories()).find((c) => c.id === categoryId);
    return { title: category?.name ?? 'Categoria' };
}

export default async function CategoryPage({ params, searchParams }: Props) {
    const { categoryId } = await params;
    const page = parsePage((await searchParams).page);

    const [categories, list] = await Promise.all([
        getCategories(),
        getProducts({ categoryId, page, limit: 10 }),
    ]);
    const category = categories.find((c) => c.id === categoryId);

    if (!category) notFound();

    return (
        <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-10">
            <TitlePill icon={<LayoutGrid aria-hidden className="size-5" />}>
                {category.name}
            </TitlePill>
            <div className="mt-6">
                {list.products.length === 0 ? (
                    <p className="text-muted-foreground">Nenhum produto nesta categoria ainda.</p>
                ) : (
                    <ProductGrid products={list.products} />
                )}
                <Pagination
                    page={list.info.page}
                    totalPages={list.info.totalPages}
                    basePath={`/produtos/${categoryId}`}
                />
            </div>
        </div>
    );
}
