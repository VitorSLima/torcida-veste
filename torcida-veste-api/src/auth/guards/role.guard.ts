import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());

    if (!roles) {
      return false;
    }
    const request = context.switchToHttp().getRequest();
    const { user } = request;

    const matchRoles = (matchroles: string[], userRole: string) => {
      const roleIsValid = matchroles.find((role) => role === userRole);

      if (!roleIsValid) {
        throw new UnauthorizedException('Role is not allowed');
      }

      return true;
    };

    return matchRoles(roles, user.userRole);
  }
}