import { IsNotEmpty, IsString } from 'class-validator';

export class CreateLeagueDto {
    @IsString()
    @IsNotEmpty()
    name: string;
}