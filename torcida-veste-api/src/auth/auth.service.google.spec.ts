import { createHash } from 'crypto';
import { UnauthorizedException } from '@nestjs/common';
import { makeAuthService } from './testing/make-auth-service';

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

describe('AuthService — Google auth code', () => {
    it('stores only the hash of the code and returns the plain code', async () => {
        const { service, authRepository } = makeAuthService();

        const code = await service.createGoogleAuthCode('u1');

        expect(code).toMatch(/^[0-9a-f]{64}$/);
        expect(authRepository.createAuthCode).toHaveBeenCalledWith({
            code_hash: sha256(code),
            user_id: 'u1',
            expires_at: expect.any(Date),
        });
    });

    it('exchanges a valid code for tokens and consumes it', async () => {
        const { service, authRepository, usersRepository } = makeAuthService();
        const user = { id: 'u1', role: 'USER', password: null };
        authRepository.findAuthCode.mockResolvedValue({
            id: 'c1',
            user_id: 'u1',
            expires_at: new Date(Date.now() + 30_000),
        });
        authRepository.deleteAuthCode.mockResolvedValue(true);
        usersRepository.findUserById.mockResolvedValue(user);

        const result = await service.exchangeGoogleAuthCode('abcd');

        expect(authRepository.findAuthCode).toHaveBeenCalledWith(sha256('abcd'));
        expect(authRepository.deleteAuthCode).toHaveBeenCalledWith('c1');
        expect(result.token).toBe('signed-token');
        expect(result.user.id).toBe('u1');
    });

    it('rejects an unknown code', async () => {
        const { service, authRepository } = makeAuthService();
        authRepository.findAuthCode.mockResolvedValue(null);

        await expect(service.exchangeGoogleAuthCode('nope')).rejects.toThrow(
            UnauthorizedException,
        );
    });

    it('rejects an expired code (and still deletes it)', async () => {
        const { service, authRepository } = makeAuthService();
        authRepository.findAuthCode.mockResolvedValue({
            id: 'c1',
            user_id: 'u1',
            expires_at: new Date(Date.now() - 1000),
        });
        authRepository.deleteAuthCode.mockResolvedValue(true);

        await expect(service.exchangeGoogleAuthCode('old')).rejects.toThrow(
            UnauthorizedException,
        );
        expect(authRepository.deleteAuthCode).toHaveBeenCalledWith('c1');
    });

    it('rejects a replayed code (delete reports nothing removed)', async () => {
        const { service, authRepository } = makeAuthService();
        authRepository.findAuthCode.mockResolvedValue({
            id: 'c1',
            user_id: 'u1',
            expires_at: new Date(Date.now() + 30_000),
        });
        authRepository.deleteAuthCode.mockResolvedValue(false);

        await expect(service.exchangeGoogleAuthCode('dup')).rejects.toThrow(
            UnauthorizedException,
        );
    });
});
