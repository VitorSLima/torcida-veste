import { toSessionUser, type SessionUser } from './session';

export type AuthResult = { user: SessionUser; token: string; refresh_token: string };
export type Tokens = { token: string; refresh_token: string };

type RawAuthResponse = { user: Record<string, unknown>; token: string; refresh_token: string };

export class AuthApiError extends Error {
    constructor(
        public readonly status: number,
        message: string,
    ) {
        super(message);
        this.name = 'AuthApiError';
    }
}

const baseUrl = () => process.env.API_URL ?? 'http://localhost:3000';

async function call<T>(
    method: 'POST' | 'PUT',
    path: string,
    body: unknown,
    bearer?: string,
): Promise<T> {
    const response = await fetch(`${baseUrl()}${path}`, {
        method,
        cache: 'no-store',
        headers: {
            'Content-Type': 'application/json',
            ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new AuthApiError(response.status, `API ${response.status} on ${method} ${path}`);
    }

    return response.json() as Promise<T>;
}

const toAuthResult = (data: RawAuthResponse): AuthResult => ({
    user: toSessionUser(data.user),
    token: data.token,
    refresh_token: data.refresh_token,
});

export async function login(email: string, password: string) {
    return toAuthResult(await call<RawAuthResponse>('POST', '/auth', { email, password }));
}

export async function register(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}) {
    return toAuthResult(await call<RawAuthResponse>('POST', '/auth/register', input));
}

export async function exchangeGoogleCode(code: string) {
    return toAuthResult(await call<RawAuthResponse>('POST', '/auth/google/exchange', { code }));
}

export async function refreshTokens(expiredAccess: string, refreshToken: string): Promise<Tokens> {
    const data = await call<Tokens>('PUT', '/auth', { refresh_token: refreshToken }, expiredAccess);
    return { token: data.token, refresh_token: data.refresh_token };
}
