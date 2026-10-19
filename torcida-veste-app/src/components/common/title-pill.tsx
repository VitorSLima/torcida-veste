import type { ReactNode } from 'react';

export function TitlePill({
    icon,
    children,
}: {
    icon?: ReactNode;
    children: ReactNode;
}) {
    return (
        <h1 className="inline-flex items-center gap-2 rounded-full border-2 border-primary px-5 py-2 text-base font-extrabold uppercase">
            {icon}
            {children}
        </h1>
    );
}
