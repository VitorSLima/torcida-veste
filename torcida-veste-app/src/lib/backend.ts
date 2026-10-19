import { resolveSession, type CookieJar } from './session-store';

const baseUrl = () => process.env.API_URL ?? 'http://localhost:3000';

export async function backendFetch(
    jar: CookieJar,
    path: string,
    init: { method?: 'GET' | 'POST'; body?: unknown } = {},
): Promise<Response> {
    const session = await resolveSession(jar);
    if (!session) return Response.json({ message: 'Não autenticado' }, { status: 401 });

    const response = await fetch(`${baseUrl()}${path}`, {
        method: init.method ?? 'GET',
        cache: 'no-store',
        headers: { Authorization: `Bearer ${session.token}`, 'Content-Type': 'application/json' },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });

    return new Response(await response.text(), {
        status: response.status,
        headers: { 'Content-Type': response.headers.get('content-type') ?? 'application/json' },
    });
}
