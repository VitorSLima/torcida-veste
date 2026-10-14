import { ConflictException } from '@nestjs/common';
import { makeAuthService } from './testing/make-auth-service';

describe('AuthService.register', () => {
    const input = {
        email: 'ana@example.com',
        password: 'Senha@1234',
        firstName: 'Ana',
        lastName: 'Silva',
    };

    it('creates a USER with a hashed password and returns tokens without the password', async () => {
        const { service, usersRepository, encryptProvider } = makeAuthService();
        usersRepository.findUserByEmail.mockResolvedValue(null);
        encryptProvider.encrypt.mockResolvedValue('hashed');
        const created = { id: 'u1', ...input, password: 'hashed', role: 'USER' };
        usersRepository.createUser.mockResolvedValue(created);
        usersRepository.findUserById.mockResolvedValue(created);

        const result = await service.register(input);

        expect(encryptProvider.encrypt).toHaveBeenCalledWith('Senha@1234', 10);
        expect(usersRepository.createUser).toHaveBeenCalledWith({
            email: 'ana@example.com',
            password: 'hashed',
            firstName: 'Ana',
            lastName: 'Silva',
            role: 'USER',
        });
        expect(result.token).toBe('signed-token');
        expect(result.refresh_token).toEqual(expect.any(String));
        expect(result.user.password).toBeUndefined();
    });

    it('rejects an email that is already registered', async () => {
        const { service, usersRepository } = makeAuthService();
        usersRepository.findUserByEmail.mockResolvedValue({ id: 'u9' });

        await expect(service.register(input)).rejects.toThrow(ConflictException);
        expect(usersRepository.createUser).not.toHaveBeenCalled();
    });
});
