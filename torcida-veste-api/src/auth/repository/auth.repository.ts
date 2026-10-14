import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/databases/prisma.database';
import { GenerateIdProvider } from '../../shared/providers/generate-id.provider';
import { InputFindRefreshTokenRepository } from './inputs/find-refresh-token.input';
import { InputUpdateRefreshTokenRepository } from './inputs/update-refresh-token.input';
import { InputCreateRefreshTokenInput } from './inputs/create-refresh-token.input';

@Injectable()
export class AuthRepository {
    constructor(
        private readonly prisma: PrismaService,
        private readonly generateIdProvider: GenerateIdProvider,
    ) {}

    async createRefreshToken(
        refreshTokenPayload: InputCreateRefreshTokenInput,
    ): Promise<void> {
        const refreshTokenId = this.generateIdProvider.generate();

        await this.prisma.session.create({
            data: {
                id: refreshTokenId,
                refresh_token: refreshTokenPayload.refresh_token,
                expires_at: refreshTokenPayload.expires_at,
                user_id: refreshTokenPayload.user_id,
            },
        });
    }

    async findRefreshToken(
        refreshTokenPayload: InputFindRefreshTokenRepository,
    ) {
        const refreshToken = await this.prisma.session.findFirst({
            where: {
                refresh_token: refreshTokenPayload.refresh_token,
                user_id: refreshTokenPayload.user_id,
            },
        });

        return refreshToken;
    }

    async deleteRefreshToken(refreshTokenId: string): Promise<void> {
        await this.prisma.session.delete({
            where: {
                id: refreshTokenId,
            },
        });
    }

    async updateRefreshToken(
        refreshTokenPayload: InputUpdateRefreshTokenRepository,
    ) {
        await this.prisma.session.update({
            where: {
                id: refreshTokenPayload.id,
            },
            data: {
                refresh_token: refreshTokenPayload.refresh_token,
                expires_at: refreshTokenPayload.expires_at,
            },
        });
    }

    async createAuthCode(input: {
        code_hash: string;
        user_id: string;
        expires_at: Date;
    }): Promise<void> {
        await this.prisma.authCode.create({ data: input });
    }

    async findAuthCode(code_hash: string) {
        return this.prisma.authCode.findUnique({ where: { code_hash } });
    }

    async deleteAuthCode(id: string): Promise<boolean> {
        const { count } = await this.prisma.authCode.deleteMany({ where: { id } });
        return count === 1;
    }
}
