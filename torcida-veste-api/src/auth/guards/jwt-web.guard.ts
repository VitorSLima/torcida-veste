import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtWebAuthGuard extends AuthGuard('jwt-web') {}
