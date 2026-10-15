import { Tag } from 'lucide-react';
import { TitlePill } from '@/components/common/title-pill';
import { Pagination } from '@/components/product/pagination';
import { ProductGrid } from '@/components/product/product-grid';
import { getProducts } from '@/lib/api';
import { parsePage } from '@/lib/products-query';

export const metadata = { title: 'Ofertas' };

export default async function OffersPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string }>;
}) {
    const page = parsePage((await searchParams).page);
    const list = await getProducts({ onSale: true, page, limit: 10 });

    return (
        <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-10">
            <TitlePill icon={<Tag aria-hidden className="size-5" />}>Ofertas</TitlePill>
            <div className="mt-6">
                {list.products.length === 0 ? (
                    <p className="text-muted-foreground">Nenhuma oferta no momento.</p>
                ) : (
                    <ProductGrid products={list.products} />
                )}
                <Pagination
                    page={list.info.page}
                    totalPages={list.info.totalPages}
                    basePath="/ofertas"
                />
            </div>
        </div>
    );
}
