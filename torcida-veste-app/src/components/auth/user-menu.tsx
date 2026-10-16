'use client';

import { User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSession } from './session-provider';

const iconButton = 'border-foreground bg-background';

export function UserMenu() {
    const { user, ready, logout } = useSession();

    if (!user) {
        return (
            <Button asChild variant="outline" size="icon" className={iconButton}>
                <Link href="/entrar" aria-label="Entrar">
                    <User />
                </Link>
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Minha conta" className={`${iconButton} border-primary text-primary`} disabled={!ready}>
                    <User />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuLabel>
                    {user.firstName} {user.lastName}
                    <span className="block text-xs font-normal text-muted-foreground">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void logout()}>Sair</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
