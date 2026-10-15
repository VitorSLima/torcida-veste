'use client';

import { Button } from '@/components/ui/button';

export default function ErrorPage({
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
            <h1 className="text-xl font-bold">Não foi possível carregar a loja</h1>
            <p className="text-sm text-muted-foreground">
                Verifique sua conexão e tente de novo em instantes.
            </p>
            <Button
                onClick={reset}
                className="bg-primary font-bold text-primary-foreground"
            >
                Tentar novamente
            </Button>
        </div>
    );
}
