import { IsHexadecimal } from 'class-validator';

export class RefreshTokenDto {
    @IsHexadecimal()
    refresh_token: string;
}
