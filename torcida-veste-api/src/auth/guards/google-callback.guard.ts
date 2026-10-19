import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleCallbackGuard extends AuthGuard('google') {
    handleRequest(_err: unknown, user: any) {
        return user || null;
    }
}
