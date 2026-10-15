import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { pageHref } from '@/lib/products-query';

export function Pagination({
    page,
    totalPages,
    basePath,
    params = {},
}: {
    page: number;
    totalPages: number;
    basePath: string;
    params?: Record<string, string | undefined>;
}) {
    if (totalPages <= 1) return null;

    return (
        <nav aria-label="Paginação" className="mt-8 flex items-center justify-center gap-4">
            {page > 1 ? (
                <Button asChild variant="outline" className="border-foreground bg-transparent">
                    <Link href={pageHref(basePath, params, page - 1)}>Anterior</Link>
                </Button>
            ) : (
                <Button variant="outline" disabled className="bg-transparent">
                    Anterior
                </Button>
            )}
            <span className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
            </span>
            {page < totalPages ? (
                <Button asChild variant="outline" className="border-foreground bg-transparent">
                    <Link href={pageHref(basePath, params, page + 1)}>Próxima</Link>
                </Button>
            ) : (
                <Button variant="outline" disabled className="bg-transparent">
                    Próxima
                </Button>
            )}
        </nav>
    );
}
