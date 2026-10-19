import { describe, expect, it } from 'vitest';
import { clientKey, createRateLimiter } from './rate-limit';

describe('createRateLimiter', () => {
    it('allows up to max per window and then blocks with a retry hint', () => {
        const check = createRateLimiter({ windowMs: 60_000, max: 3 });
        expect(check('a', 0)).toEqual({ allowed: true });
        expect(check('a', 1_000)).toEqual({ allowed: true });
        expect(check('a', 2_000)).toEqual({ allowed: true });
        expect(check('a', 3_000)).toEqual({ allowed: false, retryAfterSeconds: 57 });
    });

    it('counts each key separately', () => {
        const check = createRateLimiter({ windowMs: 60_000, max: 1 });
        expect(check('a', 0).allowed).toBe(true);
        expect(check('b', 0).allowed).toBe(true);
        expect(check('a', 1).allowed).toBe(false);
    });

    it('opens a new window after it expires', () => {
        const check = createRateLimiter({ windowMs: 1_000, max: 1 });
        expect(check('a', 0).allowed).toBe(true);
        expect(check('a', 500).allowed).toBe(false);
        expect(check('a', 1_000).allowed).toBe(true);
    });

    it('stays bounded when flooded with distinct keys', () => {
        const check = createRateLimiter({ windowMs: 60_000, max: 1 });
        for (let i = 0; i < 6_000; i += 1) check(`k${i}`, 0);
        expect(check('late', 0).allowed).toBe(true);
    });
});

describe('clientKey', () => {
    const req = (headers: Record<string, string>) => new Request('https://x.test', { headers });

    it('uses the first forwarded hop', () => {
        expect(clientKey(req({ 'x-forwarded-for': '203.0.113.9, 10.0.0.1' }))).toBe('203.0.113.9');
    });
    it('falls back to x-real-ip and then unknown', () => {
        expect(clientKey(req({ 'x-real-ip': '198.51.100.2' }))).toBe('198.51.100.2');
        expect(clientKey(req({}))).toBe('unknown');
    });
});
