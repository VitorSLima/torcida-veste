import { Logger, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { authConfig } from './config/auth.config';
import { UsersModule } from '../users/users.module';
import { SharedModule } from '../shared/shared.module';
import { AuthRepository } from './repository/auth.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtRefreshTokenStrategy } from './strategies/jwt-refresh-token.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtWebStrategy } from './strategies/jwt-web.strategy';

@Module({
  imports: [
    JwtModule.register({
      secret: authConfig.secret,
      signOptions: {
        expiresIn: authConfig.expiresIn,
      },
    }),
    UsersModule,
    SharedModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AuthRepository,
    JwtStrategy,
    JwtWebStrategy,
    JwtRefreshTokenStrategy,
    LocalStrategy,
    Logger,
  ],
  exports: [AuthService],
})
export class AuthModule {}
