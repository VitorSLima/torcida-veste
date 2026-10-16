import Link from 'next/link';
import { AuthCard } from '@/components/auth/auth-card';
import { LoginForm } from '@/components/auth/login-form';
import { safeNext } from '@/lib/session';

export const metadata = { title: 'Entrar' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
    const { next, error } = await searchParams;
    const target = safeNext(next);

    return (
        <AuthCard
            title="Entrar"
            footer={<>Não tem conta? <Link href={`/cadastrar?next=${encodeURIComponent(target)}`} className="text-primary hover:underline">Criar conta</Link></>}
        >
            <LoginForm next={target} error={error} />
        </AuthCard>
    );
}
