import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Roles } from '../decorators/roles.decorator';

function contextWith(user: unknown): ExecutionContext {
    return {
        getHandler: () => ({}),
        getClass: () => ({}),
        switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
    const reflector = new Reflector();
    const guard = new RolesGuard(reflector);

    afterEach(() => jest.restoreAllMocks());

    it('allows when no roles are required', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
        expect(guard.canActivate(contextWith({ userRole: 'USER' }))).toBe(true);
    });

    it('allows when the user has a required role', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
        expect(guard.canActivate(contextWith({ userRole: 'ADMIN' }))).toBe(true);
    });

    it('forbids when the user lacks the required role', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
        expect(() => guard.canActivate(contextWith({ userRole: 'USER' }))).toThrow(
            ForbiddenException,
        );
    });

    it('forbids when there is no authenticated user', () => {
        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);
        expect(() => guard.canActivate(contextWith(undefined))).toThrow(
            ForbiddenException,
        );
    });
});

describe('RolesGuard with the real Reflector and @Roles', () => {
    class TestController {
        @Roles('ADMIN')
        method() {}
    }

    class PlainController {
        method() {}
    }

    const guard = new RolesGuard(new Reflector());

    const ctx = (controller: any, user: unknown) =>
        ({
            getHandler: () => controller.prototype.method,
            getClass: () => controller,
            switchToHttp: () => ({ getRequest: () => ({ user }) }),
        }) as unknown as ExecutionContext;

    it('allows ADMIN on a @Roles("ADMIN") handler', () => {
        expect(guard.canActivate(ctx(TestController, { userRole: 'ADMIN' }))).toBe(
            true,
        );
    });

    it('forbids USER on a @Roles("ADMIN") handler', () => {
        expect(() =>
            guard.canActivate(ctx(TestController, { userRole: 'USER' })),
        ).toThrow(ForbiddenException);
    });

    it('allows an undecorated handler on an undecorated class', () => {
        expect(guard.canActivate(ctx(PlainController, { userRole: 'USER' }))).toBe(
            true,
        );
    });
});
