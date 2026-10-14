import { NotFoundException } from '@nestjs/common';
import { UpdateUserUseCase } from './update-user.use-case';

describe('UpdateUserUseCase', () => {
    const makeSut = () => {
        const usersRepository = {
            findUserById: jest.fn(),
            updateUser: jest.fn(),
        };
        const logger = { log: jest.fn(), error: jest.fn() };
        const sut = new UpdateUserUseCase(usersRepository as any, logger as any);
        return { sut, usersRepository };
    };

    it('returns the updated user without the password', async () => {
        const { sut, usersRepository } = makeSut();
        usersRepository.findUserById.mockResolvedValue({
            id: 'u1',
            name: 'Old',
            password: 'hash',
        });
        usersRepository.updateUser.mockResolvedValue({
            id: 'u1',
            name: 'New',
            password: 'hash',
        });

        const result = await sut.execute('u1', { name: 'New' });

        expect(result.name).toBe('New');
        expect(result.password).toBeUndefined();
    });

    it('throws NotFoundException and does not update when user is missing', async () => {
        const { sut, usersRepository } = makeSut();
        usersRepository.findUserById.mockResolvedValue(null);

        await expect(sut.execute('x', {})).rejects.toBeInstanceOf(
            NotFoundException,
        );
        expect(usersRepository.updateUser).not.toHaveBeenCalled();
    });
});
