import { AuthService } from '../auth.service';
import { GenerateHashCodeProvider } from '../../shared/providers/generate-hash-code.provider';
import { DateHandlingProvider } from '../../shared/providers/date.provider';

export function makeAuthService() {
    const usersRepository = {
        findUserByEmail: jest.fn(),
        findUserById: jest.fn(),
        createUser: jest.fn(),
    };
    const encryptProvider = { compare: jest.fn(), encrypt: jest.fn() };
    const jwtService = { sign: jest.fn().mockReturnValue('signed-token') };
    const authRepository = {
        createRefreshToken: jest.fn(),
        findRefreshToken: jest.fn(),
        deleteRefreshToken: jest.fn(),
        updateRefreshToken: jest.fn(),
        createAuthCode: jest.fn(),
        findAuthCode: jest.fn(),
        deleteAuthCode: jest.fn(),
    };
    const logger = { log: jest.fn(), error: jest.fn() };

    const service = new AuthService(
        usersRepository as any,
        encryptProvider as any,
        jwtService as any,
        new GenerateHashCodeProvider(),
        authRepository as any,
        new DateHandlingProvider(),
        logger as any,
    );

    return { service, usersRepository, encryptProvider, jwtService, authRepository };
}
