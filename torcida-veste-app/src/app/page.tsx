import { CategoryChips } from '@/components/home/category-chips';
import { FreeShippingBanner } from '@/components/home/free-shipping-banner';
import { HeroBanner } from '@/components/home/hero-banner';
import { PromoBanner } from '@/components/home/promo-banner';
import { ProductSection } from '@/components/product/product-section';
import { getCategories, getProducts } from '@/lib/api';
import { findCategory } from '@/lib/categories';

async function productsOf(categoryId?: string) {
    if (!categoryId) return [];
    const { products } = await getProducts({ categoryId, limit: 5 });
    return products;
}

export default async function HomePage() {
    const [categories, offers] = await Promise.all([
        getCategories(),
        getProducts({ onSale: true, limit: 5 }),
    ]);

    const primeiraLinha = findCategory(categories, 'Primeira Linha');
    const tailandesa = findCategory(categories, 'Tailandesa');
    const conjuntos = findCategory(categories, 'Conjuntos');
    const proSocks = findCategory(categories, 'Pro Socks');

    const [primeiraLinhaProducts, tailandesaProducts, conjuntosProducts] =
        await Promise.all([
            productsOf(primeiraLinha?.id),
            productsOf(tailandesa?.id),
            productsOf(conjuntos?.id),
        ]);

    return (
        <>
            <HeroBanner />
            <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-10 px-4 py-8 md:px-10 md:py-10">
                <CategoryChips conjuntos={conjuntos} proSocks={proSocks} />

                <ProductSection title="Ofertas" products={offers.products} href="/ofertas" />

                <div className="grid gap-4 md:grid-cols-2 md:gap-8">
                    <PromoBanner
                        value="50%"
                        label="camisetas"
                        image="/products/bayern-shirt.png"
                        href="/ofertas"
                    />
                    <PromoBanner
                        value="20%"
                        label="conjuntos"
                        image="/products/conjunto.png"
                        href={conjuntos ? `/produtos/${conjuntos.id}` : '/produtos'}
                    />
                </div>

                <ProductSection
                    title="Primeira Linha"
                    products={primeiraLinhaProducts}
                    href={primeiraLinha ? `/produtos/${primeiraLinha.id}` : undefined}
                />
                <ProductSection
                    title="Tailandesa"
                    products={tailandesaProducts}
                    href={tailandesa ? `/produtos/${tailandesa.id}` : undefined}
                />

                <FreeShippingBanner />

                <ProductSection
                    title="Conjuntos"
                    products={conjuntosProducts}
                    href={conjuntos ? `/produtos/${conjuntos.id}` : undefined}
                />
            </div>
        </>
    );
}
