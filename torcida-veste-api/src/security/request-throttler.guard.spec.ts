import { requestTracker } from './request-throttler.guard';

describe('requestTracker', () => {
    it('keys by the targeted e-mail, ignoring case and spacing', () => {
        const a = requestTracker({ body: { email: ' Ana@Example.com ' }, ip: '1.1.1.1' });
        const b = requestTracker({ body: { email: 'ana@example.com' }, ip: '2.2.2.2' });
        expect(a).toBe(b);
        expect(a).toBe('email:ana@example.com');
    });

    it('keys by a hash of the session when there is no e-mail, never storing the token', () => {
        const key = requestTracker({ headers: { authorization: 'Bearer secret-token' }, ip: '1.1.1.1' });
        expect(key).toMatch(/^session:[0-9a-f]{32}$/);
        expect(key).not.toContain('secret-token');
        expect(requestTracker({ headers: { authorization: 'Bearer other' }, ip: '1.1.1.1' })).not.toBe(key);
    });

    it('falls back to the IP', () => {
        expect(requestTracker({ ip: '9.9.9.9' })).toBe('ip:9.9.9.9');
        expect(requestTracker({})).toBe('ip:unknown');
    });

    it('ignores a non-string e-mail instead of crashing', () => {
        expect(requestTracker({ body: { email: { $ne: '' } }, ip: '3.3.3.3' })).toBe('ip:3.3.3.3');
    });
});
