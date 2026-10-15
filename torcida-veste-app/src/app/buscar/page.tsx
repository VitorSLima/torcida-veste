import { Search } from 'lucide-react';
import type { Metadata } from 'next';
import { TitlePill } from '@/components/common/title-pill';
import { Pagination } from '@/components/product/pagination';
import { ProductGrid } from '@/components/product/product-grid';
import { getProducts } from '@/lib/api';
import { parsePage } from '@/lib/products-query';

type Props = { searchParams: Promise<{ q?: string; page?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    const { q } = await searchParams;
    return { title: q ? `Busca: ${q}` : 'Busca' };
}

export default async function SearchPage({ searchParams }: Props) {
    const { q, page: rawPage } = await searchParams;
    const term = q?.trim() ?? '';
    const page = parsePage(rawPage);
    const list = term ? await getProducts({ search: term, page, limit: 10 }) : null;

    return (
        <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-10">
            <TitlePill icon={<Search aria-hidden className="size-5" />}>
                {term ? `Resultados para “${term}”` : 'Busca'}
            </TitlePill>
            <div className="mt-6">
                {!list ? (
                    <p className="text-muted-foreground">Digite o que você procura na barra de busca.</p>
                ) : list.products.length === 0 ? (
                    <p className="text-muted-foreground">Nenhum produto encontrado para “{term}”.</p>
                ) : (
                    <ProductGrid products={list.products} />
                )}
                {list && (
                    <Pagination
                        page={list.info.page}
                        totalPages={list.info.totalPages}
                        basePath="/buscar"
                        params={{ q: term }}
                    />
                )}
            </div>
        </div>
    );
}
