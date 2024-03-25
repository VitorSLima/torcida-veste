import { STOCK_STATUS } from '@prisma/client';
import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';

export class CreateProductDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    size?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNumber()
    @IsOptional()
    price?: number;

    @IsNumber()
    @IsOptional()
    pricePromo?: number;

    @IsEnum(STOCK_STATUS)
    @IsOptional()
    stockStatus?: STOCK_STATUS;
}
