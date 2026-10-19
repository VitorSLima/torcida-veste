import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAddressDto {
    @IsString()
    @IsOptional()
    zipCode?: string;

    @IsString()
    @IsOptional()
    street?: string;

    @IsString()
    @IsOptional()
    number?: string;

    @IsString()
    @IsOptional()
    complement?: string;

    @IsString()
    @IsOptional()
    neighborhood?: string;

    @IsString()
    @IsOptional()
    city?: string;

    @IsString()
    @IsOptional()
    state?: string;
}
