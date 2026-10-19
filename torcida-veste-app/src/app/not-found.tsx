import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
    return (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
            <p className="text-6xl font-extrabold text-primary">404</p>
            <h1 className="text-xl font-bold">Página não encontrada</h1>
            <p className="text-sm text-muted-foreground">
                O endereço não existe ou o produto saiu do catálogo.
            </p>
            <Button asChild className="bg-primary font-bold text-primary-foreground">
                <Link href="/">Voltar ao início</Link>
            </Button>
        </div>
    );
}
