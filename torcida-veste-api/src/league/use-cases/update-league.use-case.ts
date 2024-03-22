import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { LeaguesRepository } from '../repository/league.repository';
import { UpdateLeagueInput } from '../input/update-league.input';

@Injectable()
export class UpdateLeagueUseCase {
  constructor(
    private readonly leaguesRepository: LeaguesRepository,
    private readonly logger: Logger = new Logger(),
  ) {}

  async execute(id: string, data: UpdateLeagueInput) {
    try {
      const league = await this.leaguesRepository.findLeagueById(id);
      if (!league) {
        const error = new NotFoundException('League not found');
        this.logger.error(error.message);
        throw error;
      }
      this.leaguesRepository.updateLeague(id, data);
      this.logger.log('League updated', UpdateLeagueUseCase.name);
      return league;
    } catch (err) {
      const error = new NotFoundException('Something bad happened', {
        cause: err,
        description: 'Error on updating league',
      });
      this.logger.error(error.message);
      throw error;
    }
  }
}
