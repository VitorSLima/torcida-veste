import { IsHexadecimal, IsString, Length } from 'class-validator';

export class RefreshTokenDto {
    @IsString()
    @IsHexadecimal()
    @Length(80, 80)
    refresh_token: string;
}
