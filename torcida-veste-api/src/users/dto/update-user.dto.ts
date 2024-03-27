import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

enum Role {
    ADMIN = 'ADMIN',
    USER = 'USER',
}

export class UpdateUserDTO {
    @IsOptional()
    @IsString()
    id?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    password?: string;

    @IsOptional()
    @IsString()
    firstName?: string;

    @IsOptional()
    @IsString()
    lastName?: string;

    @IsOptional()
    @IsString()
    picture?: string;

    @IsOptional()
    @IsString()
    document?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsEnum(Role)
    role?: Role;
}
