import { IsOptional, IsString } from 'class-validator';

export class UpdateLeagueDto {
    @IsString()
    @IsOptional()
    name: string;
}