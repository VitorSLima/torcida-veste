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
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  picture?: string;
}
