import { clientKey, createRateLimiter, tooManyRequests } from '@/lib/rate-limit';

export const dynamic = 'force-dynamic';

const limiter = createRateLimiter({ windowMs: 60_000, max: 60 });

const baseUrl = () => process.env.API_URL ?? 'http://localhost:3000';

export async function POST(request: Request) {
    const limit = limiter(clientKey(request));
    if (!limit.allowed) return tooManyRequests(limit.retryAfterSeconds);

    const body: unknown = await request.json().catch(() => null);
    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
        return Response.json({ message: 'Corpo inválido' }, { status: 400 });
    }

    try {
        const response = await fetch(`${baseUrl()}/orders/quote`, {
            method: 'POST',
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        return new Response(await response.text(), {
            status: response.status,
            headers: { 'Content-Type': response.headers.get('content-type') ?? 'application/json' },
        });
    } catch {
        return Response.json({ message: 'Não foi possível calcular agora.' }, { status: 502 });
    }
}
