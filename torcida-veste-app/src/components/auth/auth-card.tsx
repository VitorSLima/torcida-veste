import type { ReactNode } from 'react';

export function AuthCard({ title, children, footer }: { title: string; children: ReactNode; footer: ReactNode }) {
    return (
        <div className="mx-auto w-full max-w-md px-4 py-10 md:py-16">
            <div className="rounded-xl bg-card p-6 md:p-10">
                <h1 className="mb-6 text-2xl font-extrabold uppercase">{title}</h1>
                {children}
            </div>
            <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
        </div>
    );
}
