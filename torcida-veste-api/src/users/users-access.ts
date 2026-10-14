import { ForbiddenException } from '@nestjs/common';

export function assertSelfOrAdmin(
    user: { userId: string; userRole?: string },
    targetId: string,
): void {
    if (user.userRole === 'ADMIN' || user.userId === targetId) return;
    throw new ForbiddenException('You can only access your own account');
}
