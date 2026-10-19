import { IsHexadecimal, Length } from 'class-validator';

export class ExchangeCodeDto {
    @IsHexadecimal()
    @Length(64, 64)
    code: string;
}
