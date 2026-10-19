import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { backendFetch } from './backend';
import type { CookieJar } from './session-store';
import { ACCESS_COOKIE, REFRESH_COOKIE, USER_COOKIE, type SessionUser } from './session';

const jwt = (exp: number) => `h.${Buffer.from(JSON.stringify({ exp })).toString('base64url')}.s`;
const user: SessionUser = { id: 'u1', email: 'a@b.com', firstName: 'Ana', lastName: 'S', role: 'USER', picture: null };

function makeJar(initial: Record<string, string> = {}) {
    const store = new Map(Object.entries(initial));
    const jar: CookieJar = {
        get: (name) => (store.has(name) ? { value: store.get(name)! } : undefined),
        set: (name, value) => void store.set(name, value),
        delete: (name) => void store.delete(name),
    };
    return { jar, store };
}

const validSession = (access: string) => ({
    [ACCESS_COOKIE]: access,
    [REFRESH_COOKIE]: 'r',
    [USER_COOKIE]: JSON.stringify(user),
});
const future = () => Math.floor(Date.now() / 1000) + 3600;

describe('backendFetch', () => {
    const fetchMock = vi.fn();

    beforeEach(() => {
        process.env.API_URL = 'http://api.test';
        fetchMock.mockReset();
        vi.stubGlobal('fetch', fetchMock);
    });
    afterEach(() => vi.unstubAllGlobals());

    it('returns 401 without calling fetch when there is no session', async () => {
        const { jar } = makeJar();
        const response = await backendFetch(jar, '/orders');

        expect(response.status).toBe(401);
        expect(await response.json()).toHaveProperty('message');
        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('calls the backend with bearer token, json header, no-store, method and body', async () => {
        const token = jwt(future());
        const { jar } = makeJar(validSession(token));
        fetchMock.mockResolvedValue(new Response('{}', { status: 201 }));

        await backendFetch(jar, '/orders', { method: 'POST', body: { a: 1 } });

        expect(fetchMock).toHaveBeenCalledWith(
            'http://api.test/orders',
            expect.objectContaining({
                method: 'POST',
                cache: 'no-store',
                body: JSON.stringify({ a: 1 }),
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            }),
        );
    });

    it('returns the backend status and body, including 409 with items', async () => {
        const { jar } = makeJar(validSession(jwt(future())));
        const payload = { code: 'CART_OUTDATED', items: [{ productId: 'p1', reason: 'OUT_OF_STOCK' }] };
        fetchMock.mockResolvedValue(
            new Response(JSON.stringify(payload), { status: 409, headers: { 'content-type': 'application/json' } }),
        );

        const response = await backendFetch(jar, '/orders', { method: 'POST', body: {} });

        expect(response.status).toBe(409);
        expect(await response.json()).toEqual(payload);
    });

    it('refreshes an expired token before calling the backend', async () => {
        const expired = jwt(Math.floor(Date.now() / 1000) - 100);
        const fresh = jwt(future());
        const { jar, store } = makeJar(validSession(expired));
        fetchMock.mockImplementation(async (url: string) =>
            url === 'http://api.test/auth'
                ? Response.json({ token: fresh, refresh_token: 'r2' })
                : new Response('[]', { status: 200 }),
        );

        const response = await backendFetch(jar, '/orders');

        expect(response.status).toBe(200);
        const orderCall = fetchMock.mock.calls.find(([url]) => url === 'http://api.test/orders');
        expect(orderCall?.[1].headers.Authorization).toBe(`Bearer ${fresh}`);
        expect(store.get(ACCESS_COOKIE)).toBe(fresh);
    });
});
