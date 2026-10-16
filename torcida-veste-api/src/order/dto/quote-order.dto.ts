import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNumber, IsOptional, IsPositive, IsString, Max, MaxLength, Min, ValidateNested } from 'class-validator';

export class OrderItemDto {
    @IsString()
    @MaxLength(64)
    productId: string;

    @IsInt()
    @Min(1)
    @Max(10)
    quantity: number;

    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    unitPrice?: number;
}

export class QuoteOrderDto {
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    @ValidateNested({ each: true })
    @Type(() => OrderItemDto)
    items: OrderItemDto[];

    @IsOptional()
    @IsString()
    @MaxLength(40)
    couponCode?: string;
}
