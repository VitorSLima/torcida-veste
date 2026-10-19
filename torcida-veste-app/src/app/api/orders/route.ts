import { cookies } from 'next/headers';
import { backendFetch } from '@/lib/backend';
import { clientKey, createRateLimiter, tooManyRequests } from '@/lib/rate-limit';

const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });

export const dynamic = 'force-dynamic';

export async function GET() {
    return backendFetch(await cookies(), '/orders');
}

export async function POST(request: Request) {
    const limit = limiter(clientKey(request));
    if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

    const body: unknown = await request.json().catch(() => null);
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return Response.json({ message: 'Corpo inválido' }, { status: 400 });
    }
    return backendFetch(await cookies(), '/orders', { method: 'POST', body });
}
