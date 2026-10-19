import Link from 'next/link';
import { BackToCartButton } from '@/components/checkout/back-to-cart-button';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Pagamento não concluído' };

export default function CanceledPage() {
    return (
        <div className="mx-auto w-full max-w-md px-4 py-10 md:py-16">
            <div className="space-y-6 rounded-xl bg-card p-6 text-center md:p-10">
                <h1 className="text-xl font-extrabold">Pagamento não concluído</h1>
                <p className="text-sm text-muted-foreground">
                    Seu carrinho foi mantido. Você pode tentar novamente quando quiser.
                </p>
                <div className="flex flex-col gap-3">
                    <BackToCartButton />
                    <Button asChild variant="outline" className="h-12 border-foreground bg-transparent font-extrabold uppercase">
                        <Link href="/pedidos">Ver meus pedidos</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
