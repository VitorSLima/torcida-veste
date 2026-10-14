import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAddressDto {
    @IsString()
    @IsNotEmpty()
    zipCode: string;

    @IsString()
    @IsNotEmpty()
    street: string;

    @IsString()
    @IsNotEmpty()
    number: string;

    @IsString()
    @IsOptional()
    complement?: string;

    @IsString()
    @IsOptional()
    neighborhood: string;

    @IsString()
    @IsNotEmpty()
    city: string;

    @IsString()
    @IsNotEmpty()
    state: string;
}