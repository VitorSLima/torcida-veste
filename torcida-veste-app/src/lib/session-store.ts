import { refreshTokens, type AuthResult, type Tokens } from './auth-api';
import {
    ACCESS_COOKIE,
    isExpired,
    REFRESH_COOKIE,
    SESSION_MAX_AGE,
    USER_COOKIE,
    type SessionUser,
} from './session';

export interface CookieJar {
    get(name: string): { value: string } | undefined;
    set(name: string, value: string, options: Record<string, unknown>): void;
    delete(name: string): void;
}

const cookieOptions = () => ({
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
});

function writeTokens(jar: CookieJar, tokens: Tokens) {
    jar.set(ACCESS_COOKIE, tokens.token, cookieOptions());
    jar.set(REFRESH_COOKIE, tokens.refresh_token, cookieOptions());
}

export function writeSession(jar: CookieJar, result: AuthResult) {
    writeTokens(jar, result);
    jar.set(USER_COOKIE, JSON.stringify(result.user), cookieOptions());
}

export function clearSession(jar: CookieJar) {
    for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, USER_COOKIE]) jar.delete(name);
}

function readUser(jar: CookieJar): SessionUser | null {
    const raw = jar.get(USER_COOKIE)?.value;
    if (!raw) return null;
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed.id === 'string' ? (parsed as SessionUser) : null;
    } catch {
        return null;
    }
}

/**
 * Só em Route Handlers / Server Actions: pode regravar cookies.
 * Renova o access token (com o refresh) quando expirado e devolve null quando não há sessão válida.
 */
export async function resolveSession(
    jar: CookieJar,
    nowMs: number = Date.now(),
    refresh: (access: string, refreshToken: string) => Promise<Tokens> = refreshTokens,
): Promise<{ token: string; user: SessionUser } | null> {
    const access = jar.get(ACCESS_COOKIE)?.value;
    const refreshToken = jar.get(REFRESH_COOKIE)?.value;
    const user = readUser(jar);

    if (!access || !refreshToken) return null;
    if (!user) {
        clearSession(jar);
        return null;
    }
    if (!isExpired(access, nowMs)) return { token: access, user };

    try {
        const tokens = await refresh(access, refreshToken);
        writeTokens(jar, tokens);
        return { token: tokens.token, user };
    } catch {
        clearSession(jar);
        return null;
    }
}
