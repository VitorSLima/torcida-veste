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
