'use client';

import { Menu } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useSession } from '@/components/auth/session-provider';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { NAV_LINKS } from './nav-links';

export function MobileNav() {
    const [open, setOpen] = useState(false);
    const { user, logout } = useSession();

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="outline"
                    size="icon"
                    aria-label="Abrir menu"
                    className="border-foreground bg-background"
                >
                    <Menu />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 border-border bg-background">
                <SheetHeader>
                    <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-3 px-4">
                    {NAV_LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setOpen(false)}
                            className="rounded-full border border-foreground px-6 py-3 text-center text-sm font-bold"
                        >
                            {link.label}
                        </Link>
                    ))}
                    {user ? (
                        <button
                            type="button"
                            onClick={() => {
                                void logout();
                                setOpen(false);
                            }}
                            className="rounded-full border border-foreground px-6 py-3 text-center text-sm font-bold"
                        >
                            Sair
                        </button>
                    ) : (
                        <Link
                            href="/entrar"
                            onClick={() => setOpen(false)}
                            className="rounded-full border border-foreground px-6 py-3 text-center text-sm font-bold"
                        >
                            Entrar
                        </Link>
                    )}
                </nav>
            </SheetContent>
        </Sheet>
    );
}
