import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh-token.guard';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly usersService: UsersService,
    private readonly authService: AuthService,
  ) {}

  @UseGuards(LocalAuthGuard)
  @Post()
  async create(@Req() req) {
    const user = await this.usersService.findUserById(req.user.id);

    const { token, refresh_token } = await this.authService.generateToken(
      req.user.id,
    );

    return {
      user: {
        ...user,
        password: undefined,
      },
      token,
      refresh_token,
    };
  }

  @UseGuards(JwtRefreshGuard)
  @Put()
  async update(@Body() requestBody: RefreshTokenDto, @Request() req) {
    return this.authService.generateRefreshToken(requestBody, req.user);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthRedirect(@Req() req) {
    return this.authService.googleLogin(req)
  }
}
