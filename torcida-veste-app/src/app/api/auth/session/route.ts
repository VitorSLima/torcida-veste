import { cookies } from 'next/headers';
import { resolveSession } from '@/lib/session-store';

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await resolveSession(await cookies());
    return Response.json({ user: session?.user ?? null }, { headers: { 'Cache-Control': 'no-store' } });
}
