import { describe, expect, it, vi } from 'vitest';
import { clearSession, resolveSession, writeSession, type CookieJar } from './session-store';
import { ACCESS_COOKIE, REFRESH_COOKIE, USER_COOKIE, type SessionUser } from './session';

const jwt = (exp: number) => `h.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.s`;
const NOW = 1_700_000_000_000;
const user: SessionUser = { id: 'u1', email: 'a@b.com', firstName: 'Ana', lastName: 'S', role: 'USER', picture: null };

function makeJar(initial: Record<string, string> = {}) {
    const store = new Map(Object.entries(initial));
    const options = new Map<string, Record<string, unknown>>();
    const jar: CookieJar = {
        get: (name) => (store.has(name) ? { value: store.get(name)! } : undefined),
        set: (name, value, opts) => {
            store.set(name, value);
            options.set(name, opts as Record<string, unknown>);
        },
        delete: (name) => void store.delete(name),
    };
    return { jar, store, options };
}

describe('writeSession', () => {
    it('writes three httpOnly lax cookies for 24h', () => {
        const { jar, store, options } = makeJar();
        writeSession(jar, { user, token: 'a', refresh_token: 'r' });

        expect(store.get(ACCESS_COOKIE)).toBe('a');
        expect(store.get(REFRESH_COOKIE)).toBe('r');
        expect(JSON.parse(store.get(USER_COOKIE)!)).toEqual(user);
        for (const opts of options.values()) {
            expect(opts).toMatchObject({ httpOnly: true, sameSite: 'lax', path: '/', maxAge: 86400 });
        }
    });
});

describe('clearSession', () => {
    it('removes all session cookies', () => {
        const { jar, store } = makeJar({ [ACCESS_COOKIE]: 'a', [REFRESH_COOKIE]: 'r', [USER_COOKIE]: '{}' });
        clearSession(jar);
        expect(store.size).toBe(0);
    });
});

describe('resolveSession', () => {
    const valid = () => ({
        [ACCESS_COOKIE]: jwt(NOW / 1000 + 600),
        [REFRESH_COOKIE]: 'r1',
        [USER_COOKIE]: JSON.stringify(user),
    });

    it('returns the session without refreshing while the token is valid', async () => {
        const { jar } = makeJar(valid());
        const refresh = vi.fn();
        const session = await resolveSession(jar, NOW, refresh);
        expect(session).toEqual({ token: valid()[ACCESS_COOKIE], user });
        expect(refresh).not.toHaveBeenCalled();
    });

    it('returns null when there is no refresh token or user', async () => {
        expect(await resolveSession(makeJar().jar, NOW, vi.fn())).toBeNull();
        const { jar } = makeJar({ [ACCESS_COOKIE]: 'x', [REFRESH_COOKIE]: 'r' });
        expect(await resolveSession(jar, NOW, vi.fn())).toBeNull();
    });

    it('refreshes an expired token and rewrites the cookies', async () => {
        const expired = jwt(NOW / 1000 - 10);
        const { jar, store } = makeJar({ ...valid(), [ACCESS_COOKIE]: expired });
        const refresh = vi.fn().mockResolvedValue({ token: 'new-a', refresh_token: 'new-r' });

        const session = await resolveSession(jar, NOW, refresh);

        expect(refresh).toHaveBeenCalledWith(expired, 'r1');
        expect(session).toEqual({ token: 'new-a', user });
        expect(store.get(ACCESS_COOKIE)).toBe('new-a');
        expect(store.get(REFRESH_COOKIE)).toBe('new-r');
    });

    it('clears the session when the refresh fails', async () => {
        const { jar, store } = makeJar({ ...valid(), [ACCESS_COOKIE]: jwt(NOW / 1000 - 10) });
        const refresh = vi.fn().mockRejectedValue(new Error('401'));

        expect(await resolveSession(jar, NOW, refresh)).toBeNull();
        expect(store.size).toBe(0);
    });

    it('clears the session when the user cookie is corrupt', async () => {
        const { jar, store } = makeJar({ ...valid(), [USER_COOKIE]: '{not json' });
        expect(await resolveSession(jar, NOW, vi.fn())).toBeNull();
        expect(store.size).toBe(0);
    });
});
