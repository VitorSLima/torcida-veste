import { Shirt } from 'lucide-react';
import Link from 'next/link';
import { MaskIcon } from '@/components/common/mask-icon';
import type { Category } from '@/lib/types';

export function CategoryChips({
    conjuntos,
    proSocks,
}: {
    conjuntos?: Category;
    proSocks?: Category;
}) {
    const chip =
        'inline-flex items-center gap-2 rounded-full border border-foreground bg-background px-5 py-2 text-sm font-bold transition-colors hover:border-primary hover:text-primary';

    return (
        <nav aria-label="Categorias" className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/buscar?q=camiseta" className={chip}>
                <Shirt aria-hidden className="size-5" />
                camisetas
            </Link>
            <Link href={conjuntos ? `/produtos/${conjuntos.id}` : '/produtos'} className={chip}>
                <MaskIcon src="/icons/hanger.svg" />
                conjuntos
            </Link>
            <Link href={proSocks ? `/produtos/${proSocks.id}` : '/produtos'} className={chip}>
                <MaskIcon src="/icons/sock.svg" />
                pro socks
            </Link>
        </nav>
    );
}
