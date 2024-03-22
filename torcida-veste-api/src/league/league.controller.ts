import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateLeagueDto } from './dto/create-league.dto';
import { UpdateLeagueInput } from './input/update-league.input';
import { LeagueService } from './league.service';

@Injectable()
@Controller('league')
@UseGuards(JwtAuthGuard)
@Roles('ADMIN')
export class LeagueController {
  constructor(private readonly leagueService: LeagueService) { }

  @Post()
  create(@Body() data: CreateLeagueDto) {
    return this.leagueService.createLeague(data);
  }
  @Get()
  findAll() {
    return this.leagueService.findAllLeagues();
  }
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leagueService.findOneLeague(id);
  }
  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateLeagueInput) {
    return this.leagueService.updateLeague(id, data);
  }
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.leagueService.deleteLeague(id);
  }
}
