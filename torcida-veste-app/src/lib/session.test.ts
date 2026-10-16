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
