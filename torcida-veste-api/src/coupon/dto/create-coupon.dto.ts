import { DISCOUNT_TYPE } from '@prisma/client';
import { IsDate, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateCouponDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsEnum(DISCOUNT_TYPE)
  @IsNotEmpty()
  discount_type: DISCOUNT_TYPE;

  @IsDate()
  @IsNotEmpty()
  expiration_at: String;
}