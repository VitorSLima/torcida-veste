import { IsOptional, IsString, IsEmail, IsNotEmpty, IsEnum } from 'class-validator';

enum Role {
    ADMIN = 'ADMIN',
    USER = 'USER',
}

export class CreateUserDTO {
    @IsOptional()
    @IsString()
    id?: string;

    @IsNotEmpty()
    @IsEmail()
    email: string;

    @IsOptional()
    @IsString()
    password?: string;

    @IsNotEmpty()
    @IsString()
    firstName: string;

    @IsNotEmpty()
    @IsString()
    lastName: string;

    @IsOptional()
    @IsString()
    picture?: string;

    @IsOptional()
    @IsString()
    document?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsEnum(Role)
    role: Role;
}
