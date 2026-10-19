export const ACCESS_COOKIE = 'tv_access';
export const REFRESH_COOKIE = 'tv_refresh';
export const USER_COOKIE = 'tv_user';
export const SESSION_MAX_AGE = 60 * 60 * 24;

export type SessionUser = {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: 'USER' | 'ADMIN';
    picture: string | null;
};

export function toSessionUser(raw: Record<string, unknown>): SessionUser {
    return {
        id: String(raw.id),
        email: String(raw.email),
        firstName: String(raw.firstName ?? ''),
        lastName: String(raw.lastName ?? ''),
        role: raw.role === 'ADMIN' ? 'ADMIN' : 'USER',
        picture: typeof raw.picture === 'string' ? raw.picture : null,
    };
}

export function decodeJwtExp(token: string): number | null {
    const part = token.split('.')[1];
    if (!part) return null;

    try {
        const payload = JSON.parse(Buffer.from(part, 'base64url').toString('utf8'));
        return typeof payload.exp === 'number' ? payload.exp : null;
    } catch {
        return null;
    }
}

export function isExpired(token: string, nowMs: number, skewSec = 30): boolean {
    const exp = decodeJwtExp(token);
    return exp === null || exp * 1000 - skewSec * 1000 <= nowMs;
}

export function safeNext(next: string | null | undefined): string {
    if (!next || !next.startsWith('/')) return '/';
    if (next.startsWith('//') || next.startsWith('/\\')) return '/';
    return next;
}
