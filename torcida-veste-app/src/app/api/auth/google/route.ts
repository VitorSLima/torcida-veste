import { NextResponse } from 'next/server';

export function GET() {
    const api = process.env.API_URL ?? 'http://localhost:3000';
    return NextResponse.redirect(`${api}/auth/google`);
}
