type Entry = { count: number; resetAt: number };

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

const MAX_TRACKED_KEYS = 5000;

/**
 * Fixed-window limiter kept in memory. On serverless each instance has its own
 * counters, so this is a best-effort brake against bursts and scripts, not a
 * global quota. It complements the API's account-level throttling.
 */
export function createRateLimiter({ windowMs, max }: { windowMs: number; max: number }) {
    const entries = new Map<string, Entry>();

    return function check(key: string, now = Date.now()): RateLimitResult {
        if (entries.size > MAX_TRACKED_KEYS) {
            for (const [k, entry] of entries) if (entry.resetAt <= now) entries.delete(k);
            if (entries.size > MAX_TRACKED_KEYS) entries.clear();
        }

        const current = entries.get(key);
        if (!current || current.resetAt <= now) {
            entries.set(key, { count: 1, resetAt: now + windowMs });
            return { allowed: true };
        }

        current.count += 1;
        if (current.count > max) {
            return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
        }
        return { allowed: true };
    };
}

/** Vercel overwrites X-Forwarded-For with the real client address; the first hop is the client. */
export function clientKey(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    const real = request.headers.get('x-real-ip')?.trim();
    return (forwarded || real || 'unknown').slice(0, 64);
}

export function tooManyRequests(retryAfterSeconds: number) {
    return Response.json(
        { message: 'Muitas tentativas. Aguarde um instante e tente novamente.' },
        { status: 429, headers: { 'Retry-After': String(retryAfterSeconds) } },
    );
}
