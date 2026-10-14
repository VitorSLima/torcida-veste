import { AuthRepository } from './auth.repository';

describe('AuthRepository.findRefreshToken', () => {
    const makeRepo = () => {
        const prisma = { session: { findFirst: jest.fn() } };
        const repo = new AuthRepository(prisma as any, {
            generate: jest.fn(),
        } as any);
        return { prisma, repo };
    };

    it('returns null without querying when the token is undefined', async () => {
        const { prisma, repo } = makeRepo();
        const result = await repo.findRefreshToken({
            refresh_token: undefined as any,
            user_id: 'u1',
        });
        expect(result).toBeNull();
        expect(prisma.session.findFirst).not.toHaveBeenCalled();
    });

    it('returns null without querying when the token is an object', async () => {
        const { prisma, repo } = makeRepo();
        const result = await repo.findRefreshToken({
            refresh_token: { not: '' } as any,
            user_id: 'u1',
        });
        expect(result).toBeNull();
        expect(prisma.session.findFirst).not.toHaveBeenCalled();
    });

    it('queries with a valid string token', async () => {
        const { prisma, repo } = makeRepo();
        prisma.session.findFirst.mockResolvedValue({ id: 's1' });
        const result = await repo.findRefreshToken({
            refresh_token: 'abc',
            user_id: 'u1',
        });
        expect(result).toEqual({ id: 's1' });
        expect(prisma.session.findFirst).toHaveBeenCalledWith({
            where: { refresh_token: 'abc', user_id: 'u1' },
        });
    });
});
