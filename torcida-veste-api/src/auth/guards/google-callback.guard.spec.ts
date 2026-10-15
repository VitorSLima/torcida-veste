import { GoogleCallbackGuard } from './google-callback.guard';

describe('GoogleCallbackGuard', () => {
    const guard = new GoogleCallbackGuard();

    it('returns the user when authentication succeeds', () => {
        const user = { id: 1 };
        expect(guard.handleRequest(null, user)).toBe(user);
    });

    it('returns null when the user is false', () => {
        expect(guard.handleRequest(null, false)).toBeNull();
    });

    it('returns null instead of throwing on error', () => {
        expect(guard.handleRequest(new Error('x'), undefined)).toBeNull();
    });
});
