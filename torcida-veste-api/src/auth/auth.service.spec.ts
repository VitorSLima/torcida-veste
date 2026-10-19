import { UnauthorizedException } from '@nestjs/common';
import { makeAuthService } from './testing/make-auth-service';

describe('AuthService — tokens and roles', () => {
    it('signs the token with the role stored on the user', async () => {
        const { service, usersRepository, jwtService } = makeAuthService();
        usersRepository.findUserById.mockResolvedValue({ id: 'u1', role: 'USER' });

        await service.generateToken('u1');

        expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'u1', role: 'USER' });
    });

    it('defaults a null role to USER', async () => {
        const { service, usersRepository, jwtService } = makeAuthService();
        usersRepository.findUserById.mockResolvedValue({ id: 'u1', role: null });

        await service.generateToken('u1');

        expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'u1', role: 'USER' });
    });

    it('validateUser returns null for accounts without a password (Google) without comparing', async () => {
        const { service, usersRepository, encryptProvider } = makeAuthService();
        usersRepository.findUserByEmail.mockResolvedValue({ id: 'u1', password: null });

        const result = await service.validateUser('a@b.com', 'whatever');

        expect(result).toBeNull();
        expect(encryptProvider.compare).not.toHaveBeenCalled();
    });

    it('refresh re-reads the role from the database, ignoring the role in the old token', async () => {
        const { service, usersRepository, authRepository, jwtService } = makeAuthService();
        authRepository.findRefreshToken.mockResolvedValue({
            id: 's1',
            expires_at: new Date(Date.now() + 60_000),
        });
        usersRepository.findUserById.mockResolvedValue({ id: 'u1', role: 'USER' });

        await service.generateRefreshToken(
            { refresh_token: 'abc' },
            { id: 'u1', role: 'ADMIN' },
        );

        expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'u1', role: 'USER' });
    });

    it('refresh fails when the user no longer exists', async () => {
        const { service, usersRepository, authRepository } = makeAuthService();
        authRepository.findRefreshToken.mockResolvedValue({
            id: 's1',
            expires_at: new Date(Date.now() + 60_000),
        });
        usersRepository.findUserById.mockResolvedValue(null);

        await expect(
            service.generateRefreshToken({ refresh_token: 'abc' }, { id: 'u1', role: 'USER' }),
        ).rejects.toThrow(UnauthorizedException);
    });
});
