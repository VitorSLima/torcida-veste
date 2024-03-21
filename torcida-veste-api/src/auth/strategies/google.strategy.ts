import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { config } from 'dotenv';
import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../users/repository/users.repository';

config();

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {

  constructor(private readonly usersRepository: UsersRepository) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate (accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
       const { name, emails, photos } = profile;
    const email = emails[0].value;
    let user = await this.usersRepository.findUserByEmail(email);

    if (!user) {
      user = await this.usersRepository.createUser({
        email,
        firstName: name.givenName,
        lastName: name.familyName,
        picture: photos[0].value,
        role: 'CLIENT'
      });
    }

    done(null, user);

  }
}


