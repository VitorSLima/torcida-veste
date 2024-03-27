import { STOCK_STATUS } from '@prisma/client';
import { IsString, IsOptional, IsEnum, IsNumber } from 'class-validator';

export class CreateProductDto {
    @IsString()
    name: string;

    @IsString()
    size: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsNumber()
    price: number;

    @IsOptional()
    @IsNumber()
    pricePromo?: number;

    @IsEnum(STOCK_STATUS)
    stock_status: STOCK_STATUS;

    @IsString()
    category_id: string;

    @IsString()
    league_id: string;
}
