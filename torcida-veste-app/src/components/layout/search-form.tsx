'use client';

import { Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function SearchForm({ className }: { className?: string }) {
    const router = useRouter();
    const [term, setTerm] = useState('');

    return (
        <form
            role="search"
            className={cn('relative', className)}
            onSubmit={(event) => {
                event.preventDefault();
                const value = term.trim();
                if (value) router.push(`/buscar?q=${encodeURIComponent(value)}`);
            }}
        >
            <Search
                aria-hidden
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2"
            />
            <Input
                type="search"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="O que você está procurando?"
                aria-label="Buscar produtos"
                className="h-10 rounded-md border-foreground bg-transparent pl-10 text-sm"
            />
        </form>
    );
}
