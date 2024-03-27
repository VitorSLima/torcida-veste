import { DISCOUNT_TYPE } from '@prisma/client';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateCouponDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsEnum(DISCOUNT_TYPE)
  @IsOptional()
  discount_type?: DISCOUNT_TYPE;

  @IsDate()
  @IsOptional()
  expiration_at?: String;
}