import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { JWTPayload } from './inputs/jwt.payload';
import { authConfig } from '../config/auth.config';

@Injectable()
export class JwtWebStrategy extends PassportStrategy(Strategy, 'jwt-web') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: authConfig.secret,
    });
  }

  async validate(payload: JWTPayload) {
    return { hash: payload.sub };
  }
}
