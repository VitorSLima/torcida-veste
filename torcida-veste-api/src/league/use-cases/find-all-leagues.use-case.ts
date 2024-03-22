import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { LeaguesRepository } from '../repository/league.repository';

@Injectable()
export class FindAllLeaguesUseCase {
  constructor(
    private readonly leaguesRepository: LeaguesRepository,
    private readonly logger: Logger = new Logger(FindAllLeaguesUseCase.name),
  ) {}

  async execute() {
    const leagues = await this.leaguesRepository.findAllLeagues();

    if (!leagues) {
      const error = new NotFoundException('Leagues not found');
      this.logger.error(error.message);
      throw error;
    }
    this.logger.log('Leagues found', FindAllLeaguesUseCase.name);
    return leagues;
  }
}
