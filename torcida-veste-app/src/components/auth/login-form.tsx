'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSession } from './session-provider';

const ERRORS: Record<string, string> = {
    google_failed: 'Não foi possível entrar com o Google. Tente novamente.',
    google_unavailable: 'Esta conta Google não pode entrar. Use e-mail e senha.',
};

export function LoginForm({ next, error }: { next: string; error?: string }) {
    const router = useRouter();
    const { reload } = useSession();
    const [fields, setFields] = useState<Record<string, string>>({});
    const [message, setMessage] = useState<string | null>(error ? (ERRORS[error] ?? null) : null);
    const [pending, setPending] = useState(false);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setPending(true);
        setFields({});
        setMessage(null);

        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
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
        <div className="space-y-4">
            <Button asChild variant="outline" className="h-11 w-full border-foreground bg-transparent font-bold">
                <a href="/api/auth/google">Continuar com Google</a>
            </Button>
            <p className="text-center text-xs uppercase text-muted-foreground">ou</p>
            <form onSubmit={onSubmit} noValidate className="space-y-4">
                <Field label="E-mail" name="email" type="email" autoComplete="email" error={fields.email} />
                <Field label="Senha" name="password" type="password" autoComplete="current-password" error={fields.password} />
                {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
                <Button type="submit" disabled={pending} className="h-11 w-full bg-primary font-extrabold uppercase text-primary-foreground hover:bg-primary/90">
                    {pending ? 'Entrando…' : 'Entrar'}
                </Button>
            </form>
            <p className="text-center text-xs text-muted-foreground">
                Conta de demonstração: demo@torcidaveste.com · Demo@1234
            </p>
        </div>
    );
}

export function Field({ label, name, type, autoComplete, error, hint }: { label: string; name: string; type: string; autoComplete: string; error?: string; hint?: string }) {
    return (
        <label className="block space-y-1.5 text-sm font-medium">
            {label}
            <Input name={name} type={type} autoComplete={autoComplete} aria-invalid={!!error} className="h-11 bg-transparent" />
            {hint && !error && <span className="block text-xs font-normal text-muted-foreground">{hint}</span>}
            {error && <span role="alert" className="block text-xs font-normal text-destructive">{error}</span>}
        </label>
    );
}
