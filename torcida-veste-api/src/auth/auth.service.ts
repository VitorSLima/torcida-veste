import { createHash } from 'crypto';
import {
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from './repository/auth.repository';
import { authConfig } from './config/auth.config';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UsersRepository } from '../users/repository/users.repository';
import { EncryptProvider } from '../shared/providers/encrypt.provider';
import { GenerateHashCodeProvider } from '../shared/providers/generate-hash-code.provider';
import { DateHandlingProvider } from '../shared/providers/date.provider';

interface UserProps {
    id: string;
    role: string;
}

@Injectable()
export class AuthService {
    constructor(
        private readonly usersRepository: UsersRepository,
        private encryptProvider: EncryptProvider,
        private readonly jwtService: JwtService,
        private readonly generateHashCodeProvider: GenerateHashCodeProvider,
        private readonly authRepository: AuthRepository,
        private readonly dateHandlingProvider: DateHandlingProvider,
        private readonly logger: Logger = new Logger(),
    ) {}

    async validateUser(email: string, password: string) {
        const user = await this.usersRepository.findUserByEmail(email);

        if (!user || !user.password) return null;

        const passwordIsCorrect = await this.encryptProvider.compare(
            user.password,
            password,
        );

        if (!passwordIsCorrect) return null;

        return user;
    }

    async register(data: {
        email: string;
        password: string;
        firstName: string;
        lastName: string;
    }) {
        const existing = await this.usersRepository.findUserByEmail(data.email);

        if (existing) {
            throw new ConflictException('Email already registered');
        }

        const password = await this.encryptProvider.encrypt(data.password, 10);

        let user;
        try {
            user = await this.usersRepository.createUser({
                email: data.email,
                password,
                firstName: data.firstName,
                lastName: data.lastName,
                role: 'USER',
            });
        } catch (err) {
            if (err?.code === 'P2002') {
                throw new ConflictException('Email already registered');
            }
            throw err;
        }

        const { token, refresh_token } = await this.generateToken(user.id);

        return {
            user: { ...user, password: undefined },
            token,
            refresh_token,
        };
    }

    async generateToken(id: string) {
        const user = await this.usersRepository.findUserById(id);

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const token = await this.jwtService.sign({
            sub: user.id,
            role: user.role ?? 'USER',
        });

        const expirationDate = await this.dateHandlingProvider.addHours(
            new Date(),
            authConfig.refreshTokenExpiresIn,
        );

        const refreshToken = await this.generateHashCodeProvider.generate(40);

        await this.authRepository.createRefreshToken({
            refresh_token: refreshToken,
            user_id: user.id,
            expires_at: expirationDate,
        });

        return {
            token,
            refresh_token: refreshToken,
        };
    }

    async generateRefreshToken(
        refreshTokenPayload: RefreshTokenDto,
        user: UserProps,
    ) {
        const refreshToken = await this.authRepository.findRefreshToken({
            refresh_token: refreshTokenPayload.refresh_token,
            user_id: user.id,
        });

        if (!refreshToken) {
            const error = new NotFoundException('Refresh token not found');
            this.logger.error(error.message);
            throw error;
        }

        const currentDate = new Date();

        const IsRefreshTokenExpired = this.dateHandlingProvider.isAfter(
            currentDate,
            refreshToken.expires_at,
        );

        if (IsRefreshTokenExpired) {
            await this.authRepository.deleteRefreshToken(refreshToken.id);
            const error = new UnauthorizedException('Refresh token expired');
            this.logger.error(error.message);
            throw error;
        }

        const dbUser = await this.usersRepository.findUserById(user.id);

        if (!dbUser) {
            const error = new UnauthorizedException('User not found');
            this.logger.error(error.message);
            throw error;
        }

        const newToken = await this.jwtService.sign({
            sub: dbUser.id,
            role: dbUser.role ?? 'USER',
        });

        const newRefreshToken = this.generateHashCodeProvider.generate(40);

        const expirationDate = this.dateHandlingProvider.addHours(
            currentDate,
            authConfig.refreshTokenExpiresIn,
        );

        await this.authRepository.updateRefreshToken({
            id: refreshToken.id,
            refresh_token: newRefreshToken,
            expires_at: expirationDate,
        });

        this.logger.log('Refresh token succesfully');

        return {
            token: newToken,
            refresh_token: newRefreshToken,
        };
    }

    private hashCode(code: string): string {
        return createHash('sha256').update(code).digest('hex');
    }

    async resolveGoogleUser(profile: {
        name?: { givenName?: string; familyName?: string };
        emails?: { value: string; verified?: boolean | string }[];
        photos?: { value: string }[];
    }) {
        const email = profile.emails?.[0];
        const verified = email?.verified === true || email?.verified === 'true';

        if (!email?.value || !verified) return null;

        const existing = await this.usersRepository.findUserByEmail(email.value);

        if (existing) {
            return existing.password ? null : existing;
        }

        return this.usersRepository.createUser({
            email: email.value,
            firstName: profile.name?.givenName ?? 'Torcedor',
            lastName: profile.name?.familyName ?? '',
            picture: profile.photos?.[0]?.value,
            role: 'USER',
        });
    }

    async createGoogleAuthCode(userId: string): Promise<string> {
        const code = this.generateHashCodeProvider.generate(32);

        await this.authRepository.createAuthCode({
            code_hash: this.hashCode(code),
            user_id: userId,
            expires_at: this.dateHandlingProvider.addMinutes(new Date(), 1),
        });

        return code;
    }

    async exchangeGoogleAuthCode(code: string) {
        const record = await this.authRepository.findAuthCode(this.hashCode(code));

        if (!record) {
            throw new UnauthorizedException('Invalid code');
        }

        const consumed = await this.authRepository.deleteAuthCode(record.id);
        const expired = this.dateHandlingProvider.isAfter(
            new Date(),
            record.expires_at,
        );

        if (!consumed || expired) {
            throw new UnauthorizedException('Invalid code');
        }

        const user = await this.usersRepository.findUserById(record.user_id);
        const { token, refresh_token } = await this.generateToken(record.user_id);

        return {
            user: { ...user, password: undefined },
            token,
            refresh_token,
        };
    }
}
