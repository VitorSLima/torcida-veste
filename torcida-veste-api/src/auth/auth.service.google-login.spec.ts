import { makeAuthService } from './testing/make-auth-service';

const profile = (overrides: any = {}) => ({
    name: { givenName: 'Ana', familyName: 'Silva' },
    emails: [{ value: 'ana@gmail.com', verified: true }],
    photos: [{ value: 'http://pic' }],
    ...overrides,
});

describe('AuthService.resolveGoogleUser', () => {
    it('creates a new USER from a verified profile when no user exists', async () => {
        const { service, usersRepository } = makeAuthService();
        const created = { id: 1 };
        usersRepository.findUserByEmail.mockResolvedValue(null);
        usersRepository.createUser.mockResolvedValue(created);

        const result = await service.resolveGoogleUser(profile());

        expect(usersRepository.createUser).toHaveBeenCalledWith({
            email: 'ana@gmail.com',
            firstName: 'Ana',
            lastName: 'Silva',
            picture: 'http://pic',
            role: 'USER',
        });
        expect(result).toBe(created);
    });

    it('accepts verified as the string "true"', async () => {
        const { service, usersRepository } = makeAuthService();
        usersRepository.findUserByEmail.mockResolvedValue(null);
        usersRepository.createUser.mockResolvedValue({ id: 2 });

        const result = await service.resolveGoogleUser(
            profile({ emails: [{ value: 'ana@gmail.com', verified: 'true' }] }),
        );

        expect(result).toEqual({ id: 2 });
    });

    it('returns the existing user when it has no password', async () => {
        const { service, usersRepository } = makeAuthService();
        const existing = { id: 3, password: null };
        usersRepository.findUserByEmail.mockResolvedValue(existing);

        const result = await service.resolveGoogleUser(profile());

        expect(result).toBe(existing);
        expect(usersRepository.createUser).not.toHaveBeenCalled();
    });

    it('returns null when the existing user has a password', async () => {
        const { service, usersRepository } = makeAuthService();
        usersRepository.findUserByEmail.mockResolvedValue({ id: 4, password: 'hash' });

        const result = await service.resolveGoogleUser(profile());

        expect(result).toBeNull();
        expect(usersRepository.createUser).not.toHaveBeenCalled();
    });

    it.each([
        ['verified is false', { emails: [{ value: 'a@b.com', verified: false }] }],
        ['verified is missing', { emails: [{ value: 'a@b.com' }] }],
    ])('returns null without querying when %s', async (_n, override) => {
        const { service, usersRepository } = makeAuthService();

        const result = await service.resolveGoogleUser(profile(override));

        expect(result).toBeNull();
        expect(usersRepository.findUserByEmail).not.toHaveBeenCalled();
        expect(usersRepository.createUser).not.toHaveBeenCalled();
    });

    it('returns null when the profile has no emails', async () => {
        const { service, usersRepository } = makeAuthService();

        expect(await service.resolveGoogleUser(profile({ emails: undefined }))).toBeNull();
        expect(await service.resolveGoogleUser(profile({ emails: [] }))).toBeNull();
        expect(usersRepository.findUserByEmail).not.toHaveBeenCalled();
    });
});
