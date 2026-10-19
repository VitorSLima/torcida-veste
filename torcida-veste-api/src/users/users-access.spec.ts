import { ForbiddenException } from '@nestjs/common';
import { assertSelfOrAdmin } from './users-access';

describe('assertSelfOrAdmin', () => {
    it('allows the user to access their own record', () => {
        expect(() => assertSelfOrAdmin({ userId: 'u1', userRole: 'USER' }, 'u1')).not.toThrow();
    });

    it('allows an admin to access any record', () => {
        expect(() => assertSelfOrAdmin({ userId: 'a1', userRole: 'ADMIN' }, 'u1')).not.toThrow();
    });

    it('forbids a regular user from accessing someone else', () => {
        expect(() => assertSelfOrAdmin({ userId: 'u2', userRole: 'USER' }, 'u1')).toThrow(
            ForbiddenException,
        );
    });
});
