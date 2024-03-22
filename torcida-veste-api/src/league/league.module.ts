import { Logger, Module } from '@nestjs/common';
import * as UseCases from './use-cases';
import { LeagueController } from './league.controller';
import { LeagueService } from './league.service';
import { LeaguesRepository } from './repository/league.repository';

const usecases = Object.values(UseCases);

@Module({
  imports: [],
  controllers: [LeagueController],
  providers: [LeagueService, LeaguesRepository, ...usecases, Logger],
  exports: [LeagueService, LeaguesRepository],
})
export class LeagueModule {}
