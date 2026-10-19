import { cookies } from 'next/headers';
import { clearSession } from '@/lib/session-store';

export async function POST() {
    clearSession(await cookies());
    return new Response(null, { status: 204 });
}
