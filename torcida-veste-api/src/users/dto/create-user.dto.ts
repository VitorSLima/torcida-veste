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

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsNotEmpty()
  @IsString()
  firstName: string;

  @IsNotEmpty()
  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  picture?: string;
}
