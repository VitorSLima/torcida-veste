import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/backend';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    return backendFetch(await cookies(), `/orders/${encodeURIComponent(id)}`);
}
