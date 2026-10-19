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
