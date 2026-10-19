import { LayoutGrid } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { TitlePill } from '@/components/common/title-pill';
import { getCategories } from '@/lib/api';
import { categoryImage, sortCategories } from '@/lib/categories';

export const metadata = { title: 'Catálogo' };

export default async function CatalogPage() {
    const categories = sortCategories(await getCategories());

    return (
        <div className="mx-auto w-full max-w-[1440px] px-4 py-8 md:px-10">
            <TitlePill icon={<LayoutGrid aria-hidden className="size-5" />}>
                Catálogo
            </TitlePill>

            <ul className="mx-auto mt-8 grid max-w-[830px] gap-6 md:grid-cols-2 md:gap-10">
                {categories.map((category) => (
                    <li key={category.id}>
                        <Link
                            href={`/produtos/${category.id}`}
                            className="group block overflow-hidden rounded-xl bg-card outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                            <div className="flex h-44 items-center justify-center bg-gradient-to-r from-[#1b5108] to-primary md:h-48">
                                <Image
                                    src={categoryImage(category.name)}
                                    alt=""
                                    width={300}
                                    height={300}
                                    className="h-36 w-auto object-contain transition-transform group-hover:scale-105 md:h-40"
                                />
                            </div>
                            <p className="py-5 text-center font-bold">{category.name}</p>
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
