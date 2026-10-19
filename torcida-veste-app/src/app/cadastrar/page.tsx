import Link from 'next/link';
import { AuthCard } from '@/components/auth/auth-card';
import { RegisterForm } from '@/components/auth/register-form';
import { safeNext } from '@/lib/session';

export const metadata = { title: 'Criar conta' };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
    const { next } = await searchParams;
    const target = safeNext(next);

    return (
        <AuthCard
            title="Criar conta"
            footer={<>Já tem conta? <Link href={`/entrar?next=${encodeURIComponent(target)}`} className="text-primary hover:underline">Entrar</Link></>}
        >
            <RegisterForm next={target} />
        </AuthCard>
    );
}
