import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthRepository } from './repository/auth.repository';
import { authConfig } from './config/auth.config';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UsersRepository } from 'src/users/repository/users.repository';
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

    if (!user) return null;

    const passwordIsCorrect = await this.encryptProvider.compare(
      user.password,
      password,
    );

    if (!passwordIsCorrect) return null;

    return user;
  }

  async generateToken(id: string) {
    const user = await this.usersRepository.findUserById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userRole = 'ADMIN';

    const token = await this.jwtService.sign({
      sub: user.id,
      role: userRole,
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

    const userRole = 'ADMIN';

    const newToken = await this.jwtService.sign({
      sub: user.id,
      role: userRole,
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
}
