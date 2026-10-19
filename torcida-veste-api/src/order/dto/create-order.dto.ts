import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNumber, IsOptional, IsPositive, IsString, MaxLength, ValidateNested } from 'class-validator';
import { OrderItemDto } from './quote-order.dto';

export class CreateOrderItemDto extends OrderItemDto {
    @IsNumber({ maxDecimalPlaces: 2 })
    @IsPositive()
    declare unitPrice: number;
}

export class CreateOrderDto {
    @IsArray()
    @ArrayMinSize(1)
    @ArrayMaxSize(50)
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items: CreateOrderItemDto[];

    @IsOptional()
    @IsString()
    @MaxLength(40)
    couponCode?: string;
}
