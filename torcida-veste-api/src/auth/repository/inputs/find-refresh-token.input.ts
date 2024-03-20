import { Session } from '@prisma/client';

export type OutputFindRefreshTokenRepository = Session | null;

export interface InputFindRefreshTokenRepository {
  user_id: string;
  refresh_token: string;
}
