import {
    Body,
    Controller,
    Get,
    Post,
    Put,
    Req,
    Request,
    Res,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtRefreshGuard } from './guards/jwt-refresh-token.guard';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ExchangeCodeDto } from './dto/exchange-code.dto';

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

    @Post('register')
    async register(
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
        data: RegisterDto,
    ) {
        return this.authService.register(data);
    }

    @UseGuards(JwtRefreshGuard)
    @Put()
    async update(
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
        requestBody: RefreshTokenDto,
        @Request() req,
    ) {
        return this.authService.generateRefreshToken(requestBody, req.user);
    }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    async googleAuth() {}

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleAuthRedirect(@Req() req, @Res() res: Response) {
        const code = await this.authService.createGoogleAuthCode(req.user.id);
        res.redirect(
            `${process.env.FRONTEND_URL}/auth/google/callback?code=${code}`,
        );
    }

    @Post('google/exchange')
    async exchangeGoogleCode(
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
        body: ExchangeCodeDto,
    ) {
        return this.authService.exchangeGoogleAuthCode(body.code);
    }
}
