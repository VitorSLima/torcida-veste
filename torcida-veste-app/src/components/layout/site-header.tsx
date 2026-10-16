import { ShoppingCart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { UserMenu } from '@/components/auth/user-menu';
import { Button } from '@/components/ui/button';
import { MobileNav } from './mobile-nav';
import { NAV_LINKS } from './nav-links';
import { SearchForm } from './search-form';

export function SiteHeader() {
    return (
        <header className="bg-background">
            <div className="mx-auto flex w-full max-w-[1440px] items-center gap-4 px-4 py-4 md:gap-8 md:px-6">
                <div className="md:hidden">
                    <MobileNav />
                </div>

                <Link href="/" aria-label="Torcida Veste, início" className="mx-auto shrink-0 md:mx-0">
                    <Image
                        src="/brand/logo.png"
                        alt="Torcida Veste"
                        width={720}
                        height={153}
                        priority
                        className="h-8 w-auto md:h-11"
                    />
                </Link>

                <div className="hidden flex-1 items-center gap-3 md:flex">
                    <SearchForm className="max-w-[415px] flex-1" />
                    <nav className="flex items-center gap-3" aria-label="Principal">
                        {NAV_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="rounded-full border border-foreground px-7 py-2 text-sm font-bold transition-colors hover:border-primary hover:text-primary"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-2 md:ml-auto">
                    <Button
                        variant="outline"
                        size="icon"
                        aria-label="Carrinho"
                        className="border-foreground bg-background"
                    >
                        <ShoppingCart />
                    </Button>
                    <div className="hidden md:block">
                        <UserMenu />
                    </div>
                </div>
            </div>

            <div className="px-4 pb-3 md:hidden">
                <SearchForm />
            </div>
        </header>
    );
}
