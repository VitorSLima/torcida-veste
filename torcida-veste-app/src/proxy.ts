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
