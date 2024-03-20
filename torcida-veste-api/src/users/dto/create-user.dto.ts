import { IsOptional, IsString, IsEmail, IsNotEmpty, IsEnum } from 'class-validator';

enum Role {
    ADMIN = 'ADMIN',
    CLIENT = 'CLIENT',
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

  @IsEnum(Role)
  role: string;
}


