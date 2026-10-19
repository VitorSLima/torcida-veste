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
