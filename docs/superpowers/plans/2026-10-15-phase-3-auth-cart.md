# Torcida Veste — Fase 3: Autenticação e Carrinho (front-end)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Login por e-mail/senha e Google, cadastro, sessão em cookies `httpOnly` e carrinho em localStorage (drawer fiel aos prints), com "Finalizar compra" exigindo login. Pedido/pagamento ficam na fase 4.

**Architecture:** O browser nunca vê os tokens. Route handlers do Next (`/api/auth/*`) conversam com a API NestJS no servidor e gravam `access`, `refresh` e dados do usuário em cookies `httpOnly`. O estado de sessão no cliente vem de `GET /api/auth/session` (mantém as páginas públicas estáticas, sem ler cookies no layout). O carrinho é um store sobre `localStorage` com lógica pura testada; o drawer é um `Sheet` do shadcn.

**Tech Stack:** Next.js 16 (route handlers, `proxy.ts`, `cookies()` assíncrono), React 19, shadcn (`dropdown-menu` novo), Vitest.

Spec: `docs/superpowers/specs/2026-10-14-torcida-veste-storefront-design.md` (seção 3) · Fase anterior: `2026-10-14-phase-2-frontend-base.md`

## Convenções

- Mesmas da fase 2: Node 24 (`PATH="$HOME/.nvm/versions/node/v24.14.0/bin:$PATH"`), testes com `node node_modules/vitest/vitest.mjs run` lendo as linhas `Test Files`/`Tests`, `tsc` via `node node_modules/.bin/tsc --noEmit`, commits com o trailer `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- **Next 16 não é o Next do seu treino.** Antes de escrever Route Handlers, `proxy.ts` ou usar `cookies()`, consulte `torcida-veste-app/node_modules/next/dist/docs/01-app/03-api-reference/` (`03-file-conventions/proxy.md`, `04-functions/cookies.md`, `03-file-conventions/route.md`). `middleware` foi renomeado para `proxy` (arquivo `src/proxy.ts`, export `proxy`).
- Nunca derrube processos por nome (`pkill -f next-server` já atingiu um servidor de outro projeto). Suba/encerre só pelo PID da porta (`kill $(lsof -tiTCP:3001 -sTCP:LISTEN)`). Portas: API `3002`, front `3001`; a `3000` não é nossa.
- Depois de `npm run build`, **não** reinicie sobre um `.next` antigo: `rm -rf .next` antes do build e reinicie o servidor depois.
- Branch nova: `feat/storefront-auth-cart`, a partir de `feat/storefront-frontend`.

## Contratos da API (conferidos no código)

| Chamada | Corpo / cabeçalho | Resposta |
|---|---|---|
| `POST /auth` (login) | `{ email, password }` | `{ user, token, refresh_token }`; 401 se inválido (inclui conta Google sem senha) |
| `POST /auth/register` | `{ email, password(8–72), firstName, lastName }`, campos extras rejeitados | 201 `{ user, token, refresh_token }`; 409 e-mail repetido; 400 validação |
| `PUT /auth` (refresh) | `Authorization: Bearer <access, pode estar expirado>` + `{ refresh_token }` (80 hex) | `{ token, refresh_token }` (o refresh é rotacionado) |
| `GET /auth/google` | navegador | redireciona ao Google; o callback da API redireciona para `${FRONTEND_URL}/auth/google/callback?code=<64 hex>` ou `${FRONTEND_URL}/entrar?error=google_unavailable` |
| `POST /auth/google/exchange` | `{ code }` (64 hex, uso único, 1 min) | `{ user, token, refresh_token }` |

`user` traz `id, email, firstName, lastName, role, picture` e outros campos; o `password` já vem `undefined`. Access token vale 15 min, refresh vale 24 h.

## Decisões

| Tema | Decisão |
|---|---|
| Cookies | `tv_access`, `tv_refresh`, `tv_user` (JSON público do usuário), todos `httpOnly`, `sameSite=lax`, `secure` só em produção, `maxAge` 24 h |
| Expiração | O backend aceita access expirado no `PUT /auth`; por isso o cookie do access dura 24 h e o servidor checa o `exp` do JWT (margem de 30 s) e renova com o refresh |
| Sessão no cliente | `SessionProvider` consulta `/api/auth/session` uma vez; páginas públicas continuam estáticas |
| Rota protegida | `src/proxy.ts` só verifica a presença de `tv_refresh` em `/pedidos/*` (a validade real é checada nas chamadas à API, fase 4) |
| `next` | Parâmetro de retorno passa por `safeNext` (só caminhos internos) |
| Cupom | O endpoint público de validação nasce na fase 4; o drawer ganha o campo lá |
| Frete | Regra espelhada do spec: R$ 5,00, grátis a partir de R$ 300,00 pagáveis. A fase 4 implementa a mesma regra no backend e ele é a fonte da verdade |
| "Descontos" no drawer | Como no print: Subtotal = soma dos preços cheios; Descontos = economia das ofertas; Total = Subtotal − Descontos + Entrega |
| Google real | O fluxo é implementado; o teste com conta Google real é do usuário (callback `http://localhost:3002/auth/google/callback` precisa estar no Google Cloud e `BASE_URL` da API apontar para `http://localhost:3002`) |
| "Finalizar compra" | Logado → `/checkout` (nasce na fase 4); deslogado → `/entrar?next=/checkout` |

## Estrutura de arquivos

```
torcida-veste-app/src/
├── proxy.ts
├── app/
│   ├── api/auth/{login,register,logout,session,google}/route.ts
│   ├── auth/google/callback/route.ts
│   ├── entrar/page.tsx
│   └── cadastrar/page.tsx
├── lib/
│   ├── session.ts            (+ test)   tipos, JWT exp, safeNext, cookies
│   ├── auth-schema.ts        (+ test)   validação de formulários
│   ├── auth-api.ts           (+ test)   cliente da API de auth (servidor)
│   ├── session-store.ts      (+ test)   gravar/limpar/renovar cookies
│   ├── shipping.ts           (+ test)
│   └── cart.ts               (+ test)   lógica pura do carrinho
└── components/
    ├── auth/{session-provider,user-menu,login-form,register-form,auth-card}.tsx
    ├── cart/{cart-provider,cart-store,cart-drawer,cart-line,cart-button}.tsx
    └── ui/dropdown-menu.tsx
```

---

### Task 0: Branch e dependência de UI

- [ ] **Step 1: Branch e `dropdown-menu`**

```bash
cd "/Users/vitorlima/Desktop/projetos e freelances/torcida-veste"
git checkout feat/storefront-frontend && git checkout -b feat/storefront-auth-cart
git add docs/superpowers/plans/2026-10-15-phase-3-auth-cart.md
git commit -q -m "docs: add phase 3 auth and cart plan

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
cd torcida-veste-app
export PATH="$HOME/.nvm/versions/node/v24.14.0/bin:$PATH"
npx shadcn@latest add dropdown-menu -y
ls src/components/ui
```
Expected: `dropdown-menu.tsx` criado. Conferir que exporta `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`.

- [ ] **Step 2: Commit** — `git add . && git commit -m "chore(app): add shadcn dropdown-menu"` (+ trailer).

---

### Task 1: Sessão e validação (TDD, funções puras)

**Files:** Create `src/lib/session.ts`, `src/lib/session.test.ts`, `src/lib/auth-schema.ts`, `src/lib/auth-schema.test.ts`.

- [ ] **Step 1: Testes** — `src/lib/session.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { decodeJwtExp, isExpired, safeNext, toSessionUser } from './session';

const jwt = (payload: object) =>
    `h.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.s`;

describe('decodeJwtExp', () => {
    it('reads exp', () => {
        expect(decodeJwtExp(jwt({ exp: 1700000000 }))).toBe(1700000000);
    });
    it('returns null for malformed tokens or missing exp', () => {
        expect(decodeJwtExp('nope')).toBeNull();
        expect(decodeJwtExp('a.%%%.c')).toBeNull();
        expect(decodeJwtExp(jwt({ sub: '1' }))).toBeNull();
    });
});

describe('isExpired', () => {
    const now = 1_700_000_000_000;
    it('is false when far from expiring', () => {
        expect(isExpired(jwt({ exp: now / 1000 + 600 }), now)).toBe(false);
    });
    it('is true when already expired', () => {
        expect(isExpired(jwt({ exp: now / 1000 - 1 }), now)).toBe(true);
    });
    it('treats the last 30 seconds as expired', () => {
        expect(isExpired(jwt({ exp: now / 1000 + 20 }), now)).toBe(true);
    });
    it('treats unreadable tokens as expired', () => {
        expect(isExpired('garbage', now)).toBe(true);
    });
});

describe('safeNext', () => {
    it('keeps internal paths with query', () => {
        expect(safeNext('/pedidos')).toBe('/pedidos');
        expect(safeNext('/checkout?x=1')).toBe('/checkout?x=1');
    });
    it('rejects external or protocol-relative targets', () => {
        expect(safeNext('//evil.com')).toBe('/');
        expect(safeNext('https://evil.com')).toBe('/');
        expect(safeNext('/\\evil.com')).toBe('/');
        expect(safeNext('javascript:alert(1)')).toBe('/');
    });
    it('falls back to / when empty', () => {
        expect(safeNext(null)).toBe('/');
        expect(safeNext(undefined)).toBe('/');
        expect(safeNext('')).toBe('/');
    });
});

describe('toSessionUser', () => {
    it('keeps only public fields', () => {
        const user = toSessionUser({
            id: 'u1',
            email: 'a@b.com',
            firstName: 'Ana',
            lastName: 'Silva',
            role: 'ADMIN',
            picture: 'http://x/y.png',
            password: 'hash',
            createdAt: 'x',
        });
        expect(user).toEqual({
            id: 'u1',
            email: 'a@b.com',
            firstName: 'Ana',
            lastName: 'Silva',
            role: 'ADMIN',
            picture: 'http://x/y.png',
        });
    });
    it('defaults role to USER and picture to null', () => {
        const user = toSessionUser({ id: '1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: null });
        expect(user.role).toBe('USER');
        expect(user.picture).toBeNull();
    });
});
```
`src/lib/auth-schema.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { validateLogin, validateRegister } from './auth-schema';

describe('validateLogin', () => {
    it('accepts valid input and trims the email', () => {
        expect(validateLogin({ email: ' a@b.com ', password: 'x' })).toEqual({
            ok: true,
            data: { email: 'a@b.com', password: 'x' },
        });
    });
    it('reports email and password errors', () => {
        const result = validateLogin({ email: 'nope', password: '' });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(['email', 'password']);
    });
    it('survives non-object input', () => {
        expect(validateLogin(null).ok).toBe(false);
        expect(validateLogin('x').ok).toBe(false);
    });
});

describe('validateRegister', () => {
    const valid = { firstName: 'Ana', lastName: 'Silva', email: 'a@b.com', password: '12345678' };
    it('accepts valid input', () => {
        expect(validateRegister(valid)).toEqual({ ok: true, data: valid });
    });
    it('requires names and an 8+ char password', () => {
        const result = validateRegister({ ...valid, firstName: ' ', lastName: '', password: '1234567' });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(['firstName', 'lastName', 'password']);
    });
    it('rejects passwords above 72 characters', () => {
        const result = validateRegister({ ...valid, password: 'a'.repeat(73) });
        expect(result.ok).toBe(false);
    });
    it('does not forward unknown fields', () => {
        const result = validateRegister({ ...valid, role: 'ADMIN' });
        expect(result.ok && 'role' in result.data).toBe(false);
    });
});
```
Rodar; esperado FAIL (módulos ausentes).

- [ ] **Step 2: Implementar `session.ts`**
```ts
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
```
- [ ] **Step 3: Implementar `auth-schema.ts`**
```ts
export type FieldErrors = Record<string, string>;
type Result<T> = { ok: true; data: T } | { ok: false; errors: FieldErrors };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const read = (input: unknown, key: string): string => {
    const value = (input as Record<string, unknown> | null)?.[key];
    return typeof value === 'string' ? value : '';
};

export type LoginData = { email: string; password: string };
export type RegisterData = LoginData & { firstName: string; lastName: string };

export function validateLogin(input: unknown): Result<LoginData> {
    const email = read(input, 'email').trim();
    const password = read(input, 'password');
    const errors: FieldErrors = {};

    if (!EMAIL.test(email)) errors.email = 'Informe um e-mail válido';
    if (!password) errors.password = 'Informe sua senha';

    return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data: { email, password } };
}

export function validateRegister(input: unknown): Result<RegisterData> {
    const firstName = read(input, 'firstName').trim();
    const lastName = read(input, 'lastName').trim();
    const email = read(input, 'email').trim();
    const password = read(input, 'password');
    const errors: FieldErrors = {};

    if (!firstName) errors.firstName = 'Informe seu nome';
    if (!lastName) errors.lastName = 'Informe seu sobrenome';
    if (!EMAIL.test(email)) errors.email = 'Informe um e-mail válido';
    if (password.length < 8) errors.password = 'A senha deve ter pelo menos 8 caracteres';
    else if (password.length > 72) errors.password = 'A senha deve ter no máximo 72 caracteres';

    return Object.keys(errors).length
        ? { ok: false, errors }
        : { ok: true, data: { firstName, lastName, email, password } };
}
```
- [ ] **Step 4: Rodar tudo** — vitest passa (`Test Files 7 passed`), `tsc` limpo. Commit: `feat(app): session helpers and form validation with tests`.

---

### Task 2: Cliente da API de auth e store de cookies (TDD)

**Files:** Create `src/lib/auth-api.ts`, `src/lib/auth-api.test.ts`, `src/lib/session-store.ts`, `src/lib/session-store.test.ts`.

- [ ] **Step 1: Testes do cliente** — `src/lib/auth-api.test.ts`:
```ts
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
```
- [ ] **Step 2: Implementar `src/lib/auth-api.ts`**
```ts
import { toSessionUser, type SessionUser } from './session';

export type AuthResult = { user: SessionUser; token: string; refresh_token: string };
export type Tokens = { token: string; refresh_token: string };

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

async function call(
    method: 'POST' | 'PUT',
    path: string,
    body: unknown,
    bearer?: string,
): Promise<any> {
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

    return response.json();
}

const toAuthResult = (data: any): AuthResult => ({
    user: toSessionUser(data.user),
    token: data.token,
    refresh_token: data.refresh_token,
});

export async function login(email: string, password: string) {
    return toAuthResult(await call('POST', '/auth', { email, password }));
}

export async function register(input: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}) {
    return toAuthResult(await call('POST', '/auth/register', input));
}

export async function exchangeGoogleCode(code: string) {
    return toAuthResult(await call('POST', '/auth/google/exchange', { code }));
}

export async function refreshTokens(expiredAccess: string, refreshToken: string): Promise<Tokens> {
    const data = await call('PUT', '/auth', { refresh_token: refreshToken }, expiredAccess);
    return { token: data.token, refresh_token: data.refresh_token };
}
```
Rodar o teste do cliente; esperado PASS.

- [ ] **Step 3: Testes do store de cookies** — `src/lib/session-store.test.ts`:
```ts
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
```
- [ ] **Step 4: Implementar `src/lib/session-store.ts`**
```ts
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
```
Nota: o teste "returns null when there is no refresh token or user" cobre o segundo caso (`access` e `refresh` presentes, sem `user`): o código limpa e devolve `null`.

- [ ] **Step 5: Rodar tudo** — vitest passa (`Test Files 9 passed`), `tsc` limpo. Mutação rápida: troque `<=` por `<` em `isExpired`, confirme que o teste da margem de 30 s falha e reverta. Commit: `feat(app): auth API client and session cookie store with tests`.

---

### Task 3: Route handlers, callback do Google e proxy

**Files:** Create `src/app/api/auth/{login,register,logout,session,google}/route.ts`, `src/app/auth/google/callback/route.ts`, `src/proxy.ts`.

- [ ] **Step 1: Login** — `src/app/api/auth/login/route.ts`:
```ts
import { cookies } from 'next/headers';
import { AuthApiError, login } from '@/lib/auth-api';
import { validateLogin } from '@/lib/auth-schema';
import { writeSession } from '@/lib/session-store';

export async function POST(request: Request) {
    const parsed = validateLogin(await request.json().catch(() => null));
    if (!parsed.ok) return Response.json({ errors: parsed.errors }, { status: 400 });

    try {
        const result = await login(parsed.data.email, parsed.data.password);
        writeSession(await cookies(), result);
        return Response.json({ user: result.user });
    } catch (error) {
        if (error instanceof AuthApiError && error.status === 401) {
            return Response.json({ message: 'E-mail ou senha incorretos' }, { status: 401 });
        }
        return Response.json({ message: 'Não foi possível entrar agora. Tente novamente.' }, { status: 502 });
    }
}
```
- [ ] **Step 2: Cadastro** — `src/app/api/auth/register/route.ts`:
```ts
import { cookies } from 'next/headers';
import { AuthApiError, register } from '@/lib/auth-api';
import { validateRegister } from '@/lib/auth-schema';
import { writeSession } from '@/lib/session-store';

export async function POST(request: Request) {
    const parsed = validateRegister(await request.json().catch(() => null));
    if (!parsed.ok) return Response.json({ errors: parsed.errors }, { status: 400 });

    try {
        const result = await register(parsed.data);
        writeSession(await cookies(), result);
        return Response.json({ user: result.user }, { status: 201 });
    } catch (error) {
        if (error instanceof AuthApiError && error.status === 409) {
            return Response.json({ errors: { email: 'Este e-mail já está cadastrado' } }, { status: 409 });
        }
        return Response.json({ message: 'Não foi possível criar a conta agora. Tente novamente.' }, { status: 502 });
    }
}
```
- [ ] **Step 3: Logout, sessão e início do Google**

`src/app/api/auth/logout/route.ts`:
```ts
import { cookies } from 'next/headers';
import { clearSession } from '@/lib/session-store';

export async function POST() {
    clearSession(await cookies());
    return new Response(null, { status: 204 });
}
```
`src/app/api/auth/session/route.ts`:
```ts
import { cookies } from 'next/headers';
import { resolveSession } from '@/lib/session-store';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await resolveSession(await cookies());
    return Response.json({ user: session?.user ?? null }, { headers: { 'Cache-Control': 'no-store' } });
}
```
`src/app/api/auth/google/route.ts`:
```ts
import { NextResponse } from 'next/server';

export function GET() {
    const api = process.env.API_URL ?? 'http://localhost:3000';
    return NextResponse.redirect(`${api}/auth/google`);
}
```
`src/app/auth/google/callback/route.ts`:
```ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { exchangeGoogleCode } from '@/lib/auth-api';
import { writeSession } from '@/lib/session-store';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code') ?? '';
    const failure = NextResponse.redirect(new URL('/entrar?error=google_failed', url));

    if (!/^[0-9a-f]{64}$/i.test(code)) return failure;

    try {
        writeSession(await cookies(), await exchangeGoogleCode(code));
        return NextResponse.redirect(new URL('/', url));
    } catch {
        return failure;
    }
}
```
- [ ] **Step 4: Proxy** — `src/proxy.ts` (confirme o nome/exports nos docs do Next 16):
```ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { REFRESH_COOKIE } from '@/lib/session';

export function proxy(request: NextRequest) {
    if (request.cookies.has(REFRESH_COOKIE)) return NextResponse.next();

    const login = new URL('/entrar', request.url);
    login.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(login);
}

export const config = { matcher: ['/pedidos/:path*'] };
```
- [ ] **Step 5: Verificar com API real**

Subir a API (`PORT=3002`, `nest build` antes) e o front (`rm -rf .next && npm run build && npm run start`), depois:
```bash
J=$(mktemp)
curl -s -c $J -X POST localhost:3001/api/auth/login -H 'Content-Type: application/json' -d '{"email":"demo@torcidaveste.com","password":"Demo@1234"}' -w "\nlogin %{http_code}\n"
grep -c "tv_" $J                       # 3
grep -E "tv_access" $J | grep -c "#HttpOnly"   # 1
curl -s -b $J localhost:3001/api/auth/session  # {"user":{...demo...}}
curl -s -b $J -c $J -X POST localhost:3001/api/auth/logout -w "logout %{http_code}\n"   # 204
curl -s -b $J localhost:3001/api/auth/session  # {"user":null}
curl -s -X POST localhost:3001/api/auth/login -H 'Content-Type: application/json' -d '{"email":"demo@torcidaveste.com","password":"errada"}' -w " %{http_code}\n"   # 401
curl -s -X POST localhost:3001/api/auth/login -H 'Content-Type: application/json' -d '{"email":"x","password":""}' -w " %{http_code}\n"   # 400
curl -s -X POST localhost:3001/api/auth/register -H 'Content-Type: application/json' -d '{"email":"demo@torcidaveste.com","password":"12345678","firstName":"A","lastName":"B"}' -w " %{http_code}\n"   # 409
curl -s -o /dev/null -w "pedidos %{http_code} -> %{redirect_url}\n" localhost:3001/pedidos   # 307 -> /entrar?next=%2Fpedidos
curl -s -o /dev/null -w "google %{http_code} -> %{redirect_url}\n" localhost:3001/api/auth/google   # 307 -> http://localhost:3002/auth/google
curl -s -o /dev/null -w "cb-bad %{http_code} -> %{redirect_url}\n" "localhost:3001/auth/google/callback?code=zz"   # 307 -> /entrar?error=google_failed
```
Teste de renovação: com o login do demo, edite o valor de `tv_access` no jar por um JWT com `exp` no passado (assinado errado serve: o backend aceita expirado só se a assinatura for válida; então gere o expirado de verdade: `cd ../torcida-veste-api && node -e` com `jsonwebtoken` e `JWT_SECRET` lido via `dotenv`, `sub` do demo e `expiresIn: -10`) e confirme que `/api/auth/session` devolve o usuário e que o `tv_access` mudou. Encerrar os dois servidores pelo PID.

- [ ] **Step 6: Commit** — `feat(app): auth route handlers, Google callback and protected-route proxy`.

---

### Task 4: Sessão no cliente, menu do usuário e header

**Files:** Create `src/components/auth/session-provider.tsx`, `src/components/auth/user-menu.tsx`; Modify `src/app/layout.tsx`, `src/components/layout/site-header.tsx`, `src/components/layout/mobile-nav.tsx`.

- [ ] **Step 1: `SessionProvider`**
```tsx
'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { SessionUser } from '@/lib/session';

type SessionState = {
    user: SessionUser | null;
    ready: boolean;
    reload: () => Promise<void>;
    logout: () => Promise<void>;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<SessionUser | null>(null);
    const [ready, setReady] = useState(false);

    const reload = useCallback(async () => {
        try {
            const response = await fetch('/api/auth/session', { cache: 'no-store' });
            const data = await response.json();
            setUser(data.user ?? null);
        } catch {
            setUser(null);
        } finally {
            setReady(true);
        }
    }, []);

    const logout = useCallback(async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
    }, []);

    useEffect(() => {
        void reload();
    }, [reload]);

    const value = useMemo(() => ({ user, ready, reload, logout }), [user, ready, reload, logout]);

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
    const context = useContext(SessionContext);
    if (!context) throw new Error('useSession must be used inside SessionProvider');
    return context;
}
```
- [ ] **Step 2: `UserMenu`** (desktop; logado mostra menu com nome e "Sair", deslogado é link para `/entrar`)
```tsx
'use client';

import { User } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSession } from './session-provider';

const iconButton = 'border-foreground bg-background';

export function UserMenu() {
    const { user, ready, logout } = useSession();

    if (!user) {
        return (
            <Button asChild variant="outline" size="icon" className={iconButton}>
                <Link href="/entrar" aria-label="Entrar">
                    <User />
                </Link>
            </Button>
        );
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Minha conta" className={`${iconButton} border-primary text-primary`} disabled={!ready}>
                    <User />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuLabel>
                    {user.firstName} {user.lastName}
                    <span className="block text-xs font-normal text-muted-foreground">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => void logout()}>Sair</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
```
- [ ] **Step 3: Plugar** — em `src/app/layout.tsx`, envolver `<SiteHeader />`, `<main>` e `<SiteFooter />` em `<SessionProvider>`. Em `site-header.tsx`, trocar o `Button asChild … Link /entrar` (hoje `hidden md:inline-flex`) por `<div className="hidden md:block"><UserMenu /></div>`. Em `mobile-nav.tsx`, depois da lista de links, acrescentar um item: se `user` → botão "Sair" (chama `logout` e fecha o Sheet), senão `Link` "Entrar" para `/entrar` (mesmo estilo de pílula dos outros itens), usando `useSession()`.
- [ ] **Step 4: Verificar** — `tsc`, lint e vitest limpos; `rm -rf .next && npm run build` passa e `/` continua `○` (estática). Commit: `feat(app): client session state and user menu`.

---

### Task 5: Páginas `/entrar` e `/cadastrar`

**Files:** Create `src/components/auth/{auth-card,login-form,register-form}.tsx`, `src/app/entrar/page.tsx`, `src/app/cadastrar/page.tsx`.

- [ ] **Step 1: `AuthCard`**
```tsx
import type { ReactNode } from 'react';

export function AuthCard({ title, children, footer }: { title: string; children: ReactNode; footer: ReactNode }) {
    return (
        <div className="mx-auto w-full max-w-md px-4 py-10 md:py-16">
            <div className="rounded-xl bg-card p-6 md:p-10">
                <h1 className="mb-6 text-2xl font-extrabold uppercase">{title}</h1>
                {children}
            </div>
            <p className="mt-6 text-center text-sm text-muted-foreground">{footer}</p>
        </div>
    );
}
```
- [ ] **Step 2: `LoginForm`** (client; erros de campo e de servidor inline; botão Google é link para `/api/auth/google`)
```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSession } from './session-provider';

const ERRORS: Record<string, string> = {
    google_failed: 'Não foi possível entrar com o Google. Tente novamente.',
    google_unavailable: 'Esta conta Google não pode entrar. Use e-mail e senha.',
};

export function LoginForm({ next, error }: { next: string; error?: string }) {
    const router = useRouter();
    const { reload } = useSession();
    const [fields, setFields] = useState<Record<string, string>>({});
    const [message, setMessage] = useState<string | null>(error ? (ERRORS[error] ?? null) : null);
    const [pending, setPending] = useState(false);

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setPending(true);
        setFields({});
        setMessage(null);

        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
        });

        if (response.ok) {
            await reload();
            router.replace(next);
            router.refresh();
            return;
        }

        const data = await response.json().catch(() => ({}));
        setFields(data.errors ?? {});
        setMessage(data.message ?? null);
        setPending(false);
    }

    return (
        <div className="space-y-4">
            <Button asChild variant="outline" className="h-11 w-full border-foreground bg-transparent font-bold">
                <a href="/api/auth/google">Continuar com Google</a>
            </Button>
            <p className="text-center text-xs uppercase text-muted-foreground">ou</p>
            <form onSubmit={onSubmit} noValidate className="space-y-4">
                <Field label="E-mail" name="email" type="email" autoComplete="email" error={fields.email} />
                <Field label="Senha" name="password" type="password" autoComplete="current-password" error={fields.password} />
                {message && <p role="alert" className="text-sm text-destructive">{message}</p>}
                <Button type="submit" disabled={pending} className="h-11 w-full bg-primary font-extrabold uppercase text-primary-foreground hover:bg-primary/90">
                    {pending ? 'Entrando…' : 'Entrar'}
                </Button>
            </form>
            <p className="text-center text-xs text-muted-foreground">
                Conta de demonstração: demo@torcidaveste.com · Demo@1234
            </p>
        </div>
    );
}

export function Field({ label, name, type, autoComplete, error }: { label: string; name: string; type: string; autoComplete: string; error?: string }) {
    return (
        <label className="block space-y-1.5 text-sm font-medium">
            {label}
            <Input name={name} type={type} autoComplete={autoComplete} aria-invalid={!!error} className="h-11 bg-transparent" />
            {error && <span role="alert" className="block text-xs font-normal text-destructive">{error}</span>}
        </label>
    );
}
```
(O link "Criar conta" fica no `footer` do `AuthCard`, dentro da página.)

- [ ] **Step 3: `RegisterForm`** — mesma estrutura do `LoginForm`, importando `Field` dele; campos `firstName`, `lastName` (lado a lado em `md:grid-cols-2`), `email`, `password` (`autoComplete="new-password"`, dica "mínimo de 8 caracteres"); POST em `/api/auth/register`; em sucesso `await reload(); router.replace(next); router.refresh();`; erros de campo vêm em `data.errors` (inclusive 409 → `errors.email`); botão "Criar conta"; sem botão Google (o Google cria a conta no primeiro acesso, via "Continuar com Google" da tela de login).
- [ ] **Step 4: Páginas** — `src/app/entrar/page.tsx`:
```tsx
import Link from 'next/link';
import { AuthCard } from '@/components/auth/auth-card';
import { LoginForm } from '@/components/auth/login-form';
import { safeNext } from '@/lib/session';

export const metadata = { title: 'Entrar' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
    const { next, error } = await searchParams;
    const target = safeNext(next);

    return (
        <AuthCard
            title="Entrar"
            footer={<>Não tem conta? <Link href={`/cadastrar?next=${encodeURIComponent(target)}`} className="text-primary hover:underline">Criar conta</Link></>}
        >
            <LoginForm next={target} error={error} />
        </AuthCard>
    );
}
```
`src/app/cadastrar/page.tsx` análoga (título "Criar conta", rodapé "Já tem conta? Entrar" → `/entrar?next=…`, renderiza `RegisterForm`).
- [ ] **Step 5: Verificar e commitar** — `tsc`, lint, vitest, build limpos. `curl` em `/entrar`, `/cadastrar` → 200. Commit: `feat(app): login and register pages`.

---

### Task 6: Lógica do carrinho (TDD)

**Files:** Create `src/lib/shipping.ts`, `src/lib/shipping.test.ts`, `src/lib/cart.ts`, `src/lib/cart.test.ts`.

- [ ] **Step 1: Testes** — `src/lib/shipping.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { FREE_SHIPPING_FROM, SHIPPING_FLAT, shippingFor } from './shipping';

describe('shippingFor', () => {
    it('is free for an empty cart', () => expect(shippingFor(0)).toBe(0));
    it('charges the flat rate below the threshold', () => expect(shippingFor(244.8)).toBe(SHIPPING_FLAT));
    it('is free at and above the threshold', () => {
        expect(shippingFor(FREE_SHIPPING_FROM)).toBe(0);
        expect(shippingFor(FREE_SHIPPING_FROM + 1)).toBe(0);
    });
});
```
`src/lib/cart.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { addItem, cartCount, cartTotals, parseCart, removeItem, serializeCart, setQuantity, type Cart } from './cart';
import { MAX_QUANTITY } from './quantity';

const shirt = { productId: 'p1', name: 'Camiseta', price: 69.9, originalPrice: 139.9, image: '/a.png' };
const set = { productId: 'p2', name: 'Conjunto', price: 169.9, originalPrice: 199.9, image: null };
const empty: Cart = { items: [] };

describe('addItem', () => {
    it('adds a new line', () => {
        expect(addItem(empty, shirt, 2).items).toEqual([{ ...shirt, quantity: 2 }]);
    });
    it('merges quantities for the same product', () => {
        const cart = addItem(addItem(empty, shirt, 1), shirt, 2);
        expect(cart.items).toHaveLength(1);
        expect(cart.items[0].quantity).toBe(3);
    });
    it('caps the quantity', () => {
        expect(addItem(addItem(empty, shirt, MAX_QUANTITY), shirt, 5).items[0].quantity).toBe(MAX_QUANTITY);
    });
    it('does not mutate the original cart', () => {
        const cart = addItem(empty, shirt);
        addItem(cart, set);
        expect(cart.items).toHaveLength(1);
    });
});

describe('setQuantity / removeItem', () => {
    const cart = addItem(addItem(empty, shirt, 1), set, 1);
    it('updates and clamps', () => {
        expect(setQuantity(cart, 'p1', 4).items[0].quantity).toBe(4);
        expect(setQuantity(cart, 'p1', 99).items[0].quantity).toBe(MAX_QUANTITY);
    });
    it('removes the line when quantity is 0 or less', () => {
        expect(setQuantity(cart, 'p1', 0).items.map((i) => i.productId)).toEqual(['p2']);
    });
    it('removeItem drops only that product', () => {
        expect(removeItem(cart, 'p2').items.map((i) => i.productId)).toEqual(['p1']);
    });
});

describe('cartCount', () => {
    it('sums quantities', () => {
        expect(cartCount(addItem(addItem(empty, shirt, 2), set, 3))).toBe(5);
    });
});

describe('cartTotals', () => {
    it('matches the mockup: 339,80 − 100,00 + 5,00 = 244,80', () => {
        const cart = addItem(addItem(empty, shirt, 1), set, 1);
        expect(cartTotals(cart)).toEqual({ subtotal: 339.8, savings: 100, shipping: 5, total: 244.8, itemCount: 2 });
    });
    it('treats items without originalPrice as no discount', () => {
        const cart = addItem(empty, { ...shirt, originalPrice: null }, 2);
        expect(cartTotals(cart)).toMatchObject({ subtotal: 139.8, savings: 0 });
    });
    it('has free shipping and zero total for an empty cart', () => {
        expect(cartTotals(empty)).toEqual({ subtotal: 0, savings: 0, shipping: 0, total: 0, itemCount: 0 });
    });
    it('gives free shipping when the payable amount reaches the threshold', () => {
        const cart = addItem(empty, { ...shirt, price: 150, originalPrice: null }, 2);
        expect(cartTotals(cart)).toMatchObject({ shipping: 0, total: 300 });
    });
    it('avoids floating point noise', () => {
        const cart = addItem(empty, { ...shirt, price: 0.1, originalPrice: null }, 3);
        expect(cartTotals(cart).subtotal).toBe(0.3);
    });
});

describe('parseCart / serializeCart', () => {
    it('round-trips', () => {
        const cart = addItem(empty, shirt, 2);
        expect(parseCart(serializeCart(cart))).toEqual(cart);
    });
    it('returns an empty cart for null, invalid JSON or wrong shape', () => {
        expect(parseCart(null)).toEqual(empty);
        expect(parseCart('{oops')).toEqual(empty);
        expect(parseCart('{"items":"x"}')).toEqual(empty);
    });
    it('drops invalid lines and clamps quantities', () => {
        const raw = JSON.stringify({
            items: [
                { ...shirt, quantity: 99 },
                { productId: 'p9', name: 'sem preço', quantity: 1 },
                { ...set, quantity: -3 },
            ],
        });
        expect(parseCart(raw).items).toEqual([{ ...shirt, quantity: MAX_QUANTITY }]);
    });
});
```
Rodar; esperado FAIL.

- [ ] **Step 2: Implementar** — `src/lib/shipping.ts`:
```ts
export const SHIPPING_FLAT = 5;
export const FREE_SHIPPING_FROM = 300;

// Regra espelhada do backend (fase 4): o backend é a fonte da verdade.
export function shippingFor(payable: number): number {
    return payable <= 0 || payable >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FLAT;
}
```
`src/lib/cart.ts`:
```ts
import { clampQuantity } from './quantity';
import { shippingFor } from './shipping';

export const CART_STORAGE_KEY = 'tv_cart_v1';

export type CartItem = {
    productId: string;
    name: string;
    price: number;
    originalPrice: number | null;
    image: string | null;
    quantity: number;
};
export type Cart = { items: CartItem[] };
export type CartProduct = Omit<CartItem, 'quantity'>;

const money = (value: number) => Math.round(value * 100) / 100;

export function addItem(cart: Cart, product: CartProduct, quantity = 1): Cart {
    const existing = cart.items.find((item) => item.productId === product.productId);

    if (!existing) {
        return { items: [...cart.items, { ...product, quantity: clampQuantity(quantity) }] };
    }

    return {
        items: cart.items.map((item) =>
            item.productId === product.productId
                ? { ...item, quantity: clampQuantity(item.quantity + quantity) }
                : item,
        ),
    };
}

export function setQuantity(cart: Cart, productId: string, quantity: number): Cart {
    if (quantity <= 0) return removeItem(cart, productId);

    return {
        items: cart.items.map((item) =>
            item.productId === productId ? { ...item, quantity: clampQuantity(quantity) } : item,
        ),
    };
}

export function removeItem(cart: Cart, productId: string): Cart {
    return { items: cart.items.filter((item) => item.productId !== productId) };
}

export function cartCount(cart: Cart): number {
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartTotals(cart: Cart) {
    let subtotal = 0;
    let payable = 0;

    for (const item of cart.items) {
        const list = item.originalPrice != null && item.originalPrice > item.price ? item.originalPrice : item.price;
        subtotal += list * item.quantity;
        payable += item.price * item.quantity;
    }

    const shipping = shippingFor(money(payable));

    return {
        subtotal: money(subtotal),
        savings: money(subtotal - payable),
        shipping,
        total: money(payable + shipping),
        itemCount: cartCount(cart),
    };
}

export const serializeCart = (cart: Cart) => JSON.stringify(cart);

const isValidItem = (item: unknown): item is CartItem => {
    const value = item as Partial<CartItem> | null;
    return (
        !!value &&
        typeof value.productId === 'string' &&
        typeof value.name === 'string' &&
        typeof value.price === 'number' &&
        Number.isFinite(value.price) &&
        typeof value.quantity === 'number'
    );
};

export function parseCart(raw: string | null): Cart {
    if (!raw) return { items: [] };

    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed?.items)) return { items: [] };

        return {
            items: parsed.items.filter(isValidItem).flatMap((item: CartItem) => {
                if (item.quantity <= 0) return [];
                return [
                    {
                        productId: item.productId,
                        name: item.name,
                        price: item.price,
                        originalPrice: typeof item.originalPrice === 'number' ? item.originalPrice : null,
                        image: typeof item.image === 'string' ? item.image : null,
                        quantity: clampQuantity(item.quantity),
                    },
                ];
            }),
        };
    } catch {
        return { items: [] };
    }
}
```
Nota: `cartTotals(cart)` com `savings` = `subtotal − payable` pode dar ruído de ponto flutuante (ex.: 100.00000000000001); `money()` resolve. Se o teste `339.8 / 100 / 244.8` falhar por arredondamento, ajuste só `money`, nunca os valores esperados.

- [ ] **Step 3: Rodar** — vitest todo passa, `tsc` limpo. Mutação: troque `payable >= FREE_SHIPPING_FROM` por `>` e confirme que o teste do limite falha; reverta. Commit: `feat(app): cart and shipping logic with tests`.

---

### Task 7: Store, drawer do carrinho e integração

**Files:** Create `src/components/cart/{cart-store.ts,cart-provider.tsx,cart-line.tsx,cart-drawer.tsx,cart-button.tsx}`; Modify `src/app/layout.tsx`, `src/components/layout/site-header.tsx`, `src/components/product/product-info.tsx`.

- [ ] **Step 1: `cart-store.ts`** (store externo para `useSyncExternalStore`, sem mismatch de hidratação)
```ts
import { CART_STORAGE_KEY, parseCart, serializeCart, type Cart } from '@/lib/cart';

export const EMPTY_CART: Cart = { items: [] };

const listeners = new Set<() => void>();
let cache: { raw: string | null; cart: Cart } = { raw: null, cart: EMPTY_CART };

function readRaw(): string | null {
    try {
        return window.localStorage.getItem(CART_STORAGE_KEY);
    } catch {
        return null;
    }
}

export function getSnapshot(): Cart {
    const raw = readRaw();
    if (raw !== cache.raw) cache = { raw, cart: raw ? parseCart(raw) : EMPTY_CART };
    return cache.cart;
}

export const getServerSnapshot = () => EMPTY_CART;

export function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
        if (event.key === CART_STORAGE_KEY || event.key === null) listener();
    };
    window.addEventListener('storage', onStorage);
    return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', onStorage);
    };
}

export function updateCart(update: (cart: Cart) => Cart) {
    const next = update(getSnapshot());
    try {
        window.localStorage.setItem(CART_STORAGE_KEY, serializeCart(next));
    } catch {
        // storage indisponível: o carrinho vale só nesta sessão da aba
        cache = { raw: serializeCart(next), cart: next };
    }
    listeners.forEach((listener) => listener());
}
```
- [ ] **Step 2: `CartProvider`**
```tsx
'use client';

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from 'react';
import { addItem, cartTotals, removeItem, setQuantity, type Cart, type CartProduct } from '@/lib/cart';
import { getServerSnapshot, getSnapshot, subscribe, updateCart } from './cart-store';

type CartState = {
    cart: Cart;
    totals: ReturnType<typeof cartTotals>;
    open: boolean;
    setOpen: (open: boolean) => void;
    add: (product: CartProduct, quantity: number) => void;
    setQty: (productId: string, quantity: number) => void;
    remove: (productId: string) => void;
};

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const cart = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    const [open, setOpen] = useState(false);

    const add = useCallback((product: CartProduct, quantity: number) => {
        updateCart((current) => addItem(current, product, quantity));
        setOpen(true);
    }, []);
    const setQty = useCallback((id: string, quantity: number) => updateCart((c) => setQuantity(c, id, quantity)), []);
    const remove = useCallback((id: string) => updateCart((c) => removeItem(c, id)), []);

    const totals = useMemo(() => cartTotals(cart), [cart]);
    const value = useMemo(() => ({ cart, totals, open, setOpen, add, setQty, remove }), [cart, totals, open, add, setQty, remove]);

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used inside CartProvider');
    return context;
}
```
- [ ] **Step 3: `CartLine`** (imagem 91×91 em `bg-card`, nome, `Price`, stepper e lixeira, como no print)
```tsx
'use client';

import { Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Price } from '@/components/product/price';
import { QuantityStepper } from '@/components/product/quantity-stepper';
import type { CartItem } from '@/lib/cart';
import { useCart } from './cart-provider';

export function CartLine({ item }: { item: CartItem }) {
    const { setQty, remove, setOpen } = useCart();

    return (
        <li className="flex gap-4">
            <Link
                href={`/produto/${item.productId}`}
                onClick={() => setOpen(false)}
                className="relative size-[91px] shrink-0 overflow-hidden rounded-lg bg-card"
            >
                {item.image && <Image src={item.image} alt={item.name} fill sizes="91px" className="object-contain p-2" />}
            </Link>
            <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-sm">{item.name}</p>
                <Price price={item.price} originalPrice={item.originalPrice} className="[&>span:first-child]:text-base" />
                <QuantityStepper value={item.quantity} onChange={(next) => setQty(item.productId, next)} />
            </div>
            <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={`Remover ${item.name}`}
                onClick={() => remove(item.productId)}
                className="self-center border-foreground bg-transparent"
            >
                <Trash2 />
            </Button>
        </li>
    );
}
```
- [ ] **Step 4: `CartDrawer`** (Sheet à direita; `w-full sm:max-w-[430px]`; título em pílula neon "CARRINHO"; totais; botão)
```tsx
'use client';

import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useSession } from '@/components/auth/session-provider';
import { formatBRL } from '@/lib/format';
import { CartLine } from './cart-line';
import { useCart } from './cart-provider';

const CHECKOUT = '/checkout';

export function CartDrawer() {
    const { cart, totals, open, setOpen } = useCart();
    const { user } = useSession();
    const empty = cart.items.length === 0;
    const href = user ? CHECKOUT : `/entrar?next=${encodeURIComponent(CHECKOUT)}`;

    const row = (label: string, value: string, strong = false) => (
        <div className={`flex items-center justify-between border-t border-border py-3 text-sm ${strong ? 'font-bold' : ''}`}>
            <dt>{label}</dt>
            <dd>{value}</dd>
        </div>
    );

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent side="right" className="w-full gap-0 border-border bg-background p-0 sm:max-w-[430px]">
                <SheetHeader className="p-6 pb-4">
                    <SheetTitle className="inline-flex w-fit items-center gap-2 rounded-full border-2 border-primary px-4 py-1.5 text-base font-extrabold uppercase">
                        <ShoppingCart aria-hidden className="size-5" />
                        Carrinho
                    </SheetTitle>
                    <SheetDescription className="sr-only">Itens do seu carrinho</SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto px-6">
                    {empty ? (
                        <div className="space-y-4 py-10 text-center text-sm text-muted-foreground">
                            <p>Seu carrinho está vazio.</p>
                            <Button asChild variant="outline" className="border-foreground bg-transparent" onClick={() => setOpen(false)}>
                                <Link href="/produtos">Ver produtos</Link>
                            </Button>
                        </div>
                    ) : (
                        <>
                            <ul className="space-y-5 pb-6">
                                {cart.items.map((item) => (
                                    <CartLine key={item.productId} item={item} />
                                ))}
                            </ul>
                            <dl>
                                {row('Subtotal', formatBRL(totals.subtotal))}
                                {row('Entrega', totals.shipping === 0 ? 'Grátis' : formatBRL(totals.shipping))}
                                {row('Descontos', totals.savings > 0 ? `- ${formatBRL(totals.savings)}` : formatBRL(0))}
                                {row('Total', formatBRL(totals.total), true)}
                            </dl>
                        </>
                    )}
                </div>

                <div className="p-6">
                    {empty ? (
                        <Button disabled className="h-12 w-full font-extrabold uppercase">Finalizar compra</Button>
                    ) : (
                        <Button asChild className="h-12 w-full bg-primary font-extrabold uppercase text-primary-foreground hover:bg-primary/90">
                            <Link href={href} onClick={() => setOpen(false)}>Finalizar compra</Link>
                        </Button>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
```
- [ ] **Step 5: `CartButton`** (substitui o botão de carrinho do header; badge de quantidade)
```tsx
'use client';

import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from './cart-provider';

export function CartButton() {
    const { totals, setOpen } = useCart();

    return (
        <Button
            variant="outline"
            size="icon"
            aria-label={`Carrinho, ${totals.itemCount} ${totals.itemCount === 1 ? 'item' : 'itens'}`}
            onClick={() => setOpen(true)}
            className="relative border-foreground bg-background"
        >
            <ShoppingCart />
            {totals.itemCount > 0 && (
                <span className="absolute -right-2 -top-2 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-bold leading-5 text-primary-foreground">
                    {totals.itemCount}
                </span>
            )}
        </Button>
    );
}
```
- [ ] **Step 6: Integrar**
  - `layout.tsx`: dentro de `SessionProvider`, envolver com `<CartProvider>` e renderizar `<CartDrawer />` ao lado do `<SiteFooter />`.
  - `site-header.tsx`: trocar o `Button` do carrinho por `<CartButton />`.
  - `product-info.tsx`: `const { add } = useCart();` e no botão "Adicionar ao carrinho": `onClick={() => add({ productId: product.id, name: product.name, price: product.price, originalPrice: product.originalPrice, image: (product.Images.find((i) => i.is_Cover) ?? product.Images[0])?.url ?? null }, quantity)}`.
- [ ] **Step 7: Verificar e commitar** — `tsc`, lint, vitest e `rm -rf .next && npm run build` limpos. Commit: `feat(app): cart store, drawer and add-to-cart`.

---

### Task 8: Verificação ponta a ponta e visual

**Files:** nenhum (correções seguem o ciclo corrigir → rever → commit). O script de e2e fica no scratchpad, **fora do repositório**.

- [ ] **Step 1: Suíte e build** — `node node_modules/vitest/vitest.mjs run` (todos passam), `tsc`, `npm run lint`, `rm -rf .next && npm run build`; backend `node node_modules/jest/bin/jest.js` segue 15 suítes/67 testes.
- [ ] **Step 2: Subir API (`PORT=3002`) e front (`npm run start`)**, e conferir `curl` de `/entrar`, `/cadastrar`, `/api/auth/session` (200).
- [ ] **Step 3: E2E com navegador real via `puppeteer-core`** (a extensão do Chrome pode não estar conectada; usar o Chrome instalado em `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`). No diretório do scratchpad: `npm init -y && npm i puppeteer-core`. Script `e2e.mjs`, cobrindo, com `page.setViewport` 1440×900 e depois 390×844:
  1. Home → clicar "Adicionar" em `/produto/seed-product-01`: o drawer abre, badge do header mostra 1, linha mostra `R$ 69,90`/`R$ 139,90`.
  2. Adicionar `seed-product-10` (conjunto, R$ 159,90 / R$ 199,90): com os dois itens os totais são Subtotal `R$ 339,80`, Entrega `R$ 5,00`, Descontos `- R$ 110,00`, Total `R$ 234,80` (igual ao print mobile).
  3. Recarregar a página: carrinho e badge persistem (localStorage). Aumentar quantidade e remover itens: totais atualizam; carrinho vazio mostra a mensagem e o botão desabilitado.
  4. Deslogado, "Finalizar compra" → URL `/entrar?next=%2Fcheckout`.
  5. Login com `demo@torcidaveste.com` / `Demo@1234` pela UI: redireciona para `/checkout` (404 esperado até a fase 4), ícone do usuário fica verde, menu mostra o nome; "Sair" volta ao estado deslogado; recarregar mantém a sessão enquanto logado.
  6. Login com senha errada mostra "E-mail ou senha incorretos"; cadastro com e-mail existente mostra "Este e-mail já está cadastrado"; cadastro novo (e-mail único `teste+<timestamp>@example.com`) loga o usuário.
  7. `/pedidos` deslogado redireciona para `/entrar?next=%2Fpedidos`.
  8. Nenhum erro no console (`page.on('console')` / `pageerror`) em nenhuma etapa.
  Salvar screenshots do drawer (desktop e mobile) e do login/cadastro e **abrir** cada um para comparar com `Torcida Veste/desktop/5-product-cart.png` e `mobile/5-product-cart.png`: cabeçalho em pílula neon, miniatura em cartão, lixeira em contorno, linhas divisórias, botão "FINALIZAR COMPRA" neon fixo no rodapé.
  Remover o usuário criado no passo 6 do banco ao final (script com `PrismaClient` e `NODE_PATH` do backend) para não poluir o seed.
- [ ] **Step 4: Google** — conferir só o que é verificável sem credenciais: `/api/auth/google` redireciona para a API e o callback com código inválido volta para `/entrar?error=google_failed` (mensagem exibida). Registrar no relatório que o login real com Google depende do usuário (Google Cloud + `BASE_URL`).
- [ ] **Step 5: Encerrar** os servidores pelo PID (portas 3001 e 3002), `git status` limpo, relatório com evidências.

---

## Self-review (spec × plano)

| Requisito (spec seção 3) | Task |
|---|---|
| Cookies `httpOnly`/`secure`/`sameSite=lax`; tokens fora do JS | 2, 3 |
| Proxy/middleware protege `/pedidos` | 3 |
| `/entrar`, `/cadastrar`, `/auth/google/callback` | 3, 5 |
| E-mail/senha + Google (código de uso único) | 2, 3, 5 |
| Carrinho em localStorage, drawer Sheet, subtotal/entrega/descontos/total | 6, 7 |
| "Finalizar compra" → login se necessário | 7 |
| Testes do carrinho (adicionar, remover, quantidades, totais, persistência) | 6 |
| Cupom no carrinho | **Fase 4** (precisa do endpoint de validação) |
| `POST /orders`, Stripe, `/pedidos`, `/checkout/*` | **Fase 4** |
