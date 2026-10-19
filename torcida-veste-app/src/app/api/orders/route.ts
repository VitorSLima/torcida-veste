import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/backend';

export const dynamic = 'force-dynamic';

export async function GET() {
    return backendFetch(await cookies(), '/orders');
}

export async function POST(request: Request) {
    const body: unknown = await request.json().catch(() => null);
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return Response.json({ message: 'Corpo inválido' }, { status: 400 });
    }
    return backendFetch(await cookies(), '/orders', { method: 'POST', body });
}
