import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
    @IsEmail()
    @MaxLength(254)
    email: string;

    @IsString()
    @MinLength(8)
    @MaxLength(72)
    password: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(80)
    firstName: string;

    @IsString()
    @IsNotEmpty()
    @MaxLength(80)
    lastName: string;
}
