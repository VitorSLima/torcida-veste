import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthApiError, exchangeGoogleCode, login, refreshTokens, register } from './auth-api';

const fetchMock = vi.fn();
const respond = (status: number, body: unknown = {}) =>
    fetchMock.mockResolvedValueOnce({ ok: status >= 200 && status < 300, status, json: async () => body });

const apiUser = { id: 'u1', email: 'a@b.com', firstName: 'Ana', lastName: 'S', role: 'USER', password: undefined, createdAt: 'x' };

beforeEach(() => {
    process.env.API_URL = 'http://api.test';
    vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
});

describe('login', () => {
    it('posts credentials and returns a sanitized session', async () => {
        respond(201, { user: apiUser, token: 't', refresh_token: 'r' });

        const result = await login('a@b.com', 'secret');

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('http://api.test/auth');
        expect(init.method).toBe('POST');
        expect(JSON.parse(init.body)).toEqual({ email: 'a@b.com', password: 'secret' });
        expect(init.cache).toBe('no-store');
        expect(result).toEqual({
            user: { id: 'u1', email: 'a@b.com', firstName: 'Ana', lastName: 'S', role: 'USER', picture: null },
            token: 't',
            refresh_token: 'r',
        });
    });
    it('throws AuthApiError with the status on failure', async () => {
        respond(401);
        await expect(login('a@b.com', 'bad')).rejects.toMatchObject({ name: 'AuthApiError', status: 401 });
    });
});

describe('register', () => {
    it('posts to /auth/register', async () => {
        respond(201, { user: apiUser, token: 't', refresh_token: 'r' });
        await register({ email: 'a@b.com', password: '12345678', firstName: 'Ana', lastName: 'S' });
        expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/auth/register');
    });
    it('surfaces 409', async () => {
        respond(409);
        await expect(
            register({ email: 'a@b.com', password: '12345678', firstName: 'A', lastName: 'B' }),
        ).rejects.toBeInstanceOf(AuthApiError);
    });
});

describe('refreshTokens', () => {
    it('sends the old access token as bearer and the refresh token in the body', async () => {
        respond(200, { token: 'new', refresh_token: 'newr' });

        const result = await refreshTokens('old-access', 'old-refresh');

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toBe('http://api.test/auth');
        expect(init.method).toBe('PUT');
        expect(init.headers.Authorization).toBe('Bearer old-access');
        expect(JSON.parse(init.body)).toEqual({ refresh_token: 'old-refresh' });
        expect(result).toEqual({ token: 'new', refresh_token: 'newr' });
    });
});

describe('exchangeGoogleCode', () => {
    it('posts the one-time code', async () => {
        respond(201, { user: apiUser, token: 't', refresh_token: 'r' });
        const result = await exchangeGoogleCode('a'.repeat(64));
        expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/auth/google/exchange');
        expect(result.user.id).toBe('u1');
    });
});
