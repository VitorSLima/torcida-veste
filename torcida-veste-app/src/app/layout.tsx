import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { SessionProvider } from '@/components/auth/session-provider';
import { CartDrawer } from '@/components/cart/cart-drawer';
import { CartProvider } from '@/components/cart/cart-provider';
import { SiteFooter } from '@/components/layout/site-footer';
import { SiteHeader } from '@/components/layout/site-header';
import './globals.css';

const poppins = Poppins({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700', '800'],
    variable: '--font-poppins',
    display: 'swap',
});

export const metadata: Metadata = {
    title: {
        default: 'Torcida Veste — Artigos esportivos',
        template: '%s | Torcida Veste',
    },
    description:
        'Camisetas, conjuntos e acessórios para torcer com estilo. Projeto de portfólio.',
};

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="pt-BR" className={poppins.variable}>
            <body className="flex min-h-dvh flex-col bg-background font-sans text-foreground antialiased">
                <SessionProvider>
                    <CartProvider>
                        <SiteHeader />
                        <main className="flex-1">{children}</main>
                        <SiteFooter />
                        <CartDrawer />
                    </CartProvider>
                </SessionProvider>
            </body>
        </html>
    );
}
