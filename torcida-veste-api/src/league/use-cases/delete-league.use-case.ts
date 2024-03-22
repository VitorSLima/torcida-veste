import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { LeaguesRepository } from '../repository/league.repository';

@Injectable()
export class DeleteLeagueUseCase {
  constructor(
    private readonly leaguesRepository: LeaguesRepository,
    private readonly logger: Logger = new Logger(),
  ) {}

  async execute(id: string) {
    const league = this.leaguesRepository.findLeagueById(id);
    if (!league) {
      const error = new NotFoundException('League not found');
      this.logger.error(error.message);
      throw error;
    }

    try {
      this.leaguesRepository.deleteLeague(id);
      this.logger.log('League deleted', DeleteLeagueUseCase.name);
    } catch (err) {
      const error = new NotFoundException('Something bad happened', {
        cause: err,
        description: 'Error on deleting league',
      });
      this.logger.error(error.message);
      throw error;
    }
    return league;
  }
}
