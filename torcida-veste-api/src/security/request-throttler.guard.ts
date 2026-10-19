import { createHash } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * The storefront calls this API from its own server, so the socket IP is the
 * storefront's and says nothing about the end user. Limits are therefore keyed
 * by the most specific identity available: the account being targeted (e-mail
 * in the body), then the caller's session, then the IP.
 */
export function requestTracker(req: Record<string, any>): string {
    const email = req.body?.email;
    if (typeof email === 'string' && email.trim()) {
        return `email:${email.trim().toLowerCase().slice(0, 254)}`;
    }

    const authorization = req.headers?.authorization;
    if (typeof authorization === 'string' && authorization) {
        return `session:${createHash('sha256').update(authorization).digest('hex').slice(0, 32)}`;
    }

    return `ip:${req.ip ?? 'unknown'}`;
}

@Injectable()
export class RequestThrottlerGuard extends ThrottlerGuard {
    protected async getTracker(req: Record<string, any>): Promise<string> {
        return requestTracker(req);
    }
}
