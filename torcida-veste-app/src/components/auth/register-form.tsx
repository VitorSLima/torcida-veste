'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field } from './login-form';
import { useSession } from './session-provider';

export function RegisterForm({ next }: { next: string }) {
    const router = useRouter();
    const { reload } = useSession();
    const [fields, setFields] = useState<Record<string, string>>({});
    const [message, setMessage] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setPending(true);
        setFields({});
        setMessage(null);

        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                firstName: form.get('firstName'),
                lastName: form.get('lastName'),
                email: form.get('email'),
                password: form.get('password'),
            }),
        });

        if (response.ok) {
            await reload();
            router.replace(next);
            router.refresh();
            return;
        }

        const data = await response.json().catch(() => ({}));
        setFields(data.errors ?? {});
        setMessage(data.message ?? null);
        setPending(false);
    }

    return (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <Field label="Nome" name="firstName" type="text" autoComplete="given-name" error={fields.firstName} />
                <Field label="Sobrenome" name="lastName" type="text" autoComplete="family-name" error={fields.lastName} />
            </div>
            <Field label="E-mail" name="email" type="email" autoComplete="email" error={fields.email} />
            <Field label="Senha" name="password" type="password" autoComplete="new-password" error={fields.password} hint="Mínimo de 8 caracteres" />
            {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
            <Button type="submit" disabled={pending} className="h-11 w-full bg-primary font-extrabold uppercase text-primary-foreground hover:bg-primary/90">
                {pending ? 'Criando conta…' : 'Criar conta'}
            </Button>
        </form>
    );
}
