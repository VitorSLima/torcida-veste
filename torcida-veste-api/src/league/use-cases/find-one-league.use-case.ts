import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { LeaguesRepository } from '../repository/league.repository';

@Injectable()
export class FindOneLeagueUseCase {
  constructor(
    private readonly leaguesRepository: LeaguesRepository,
    private readonly logger: Logger = new Logger(FindOneLeagueUseCase.name),
  ) { }

  async execute(id: string) {
    try {
      const league = await this.leaguesRepository.findLeagueById(id);
      if (!league) {
        const error = new NotFoundException('League not found');
        this.logger.error(error.message);
        throw error;
      }
      this.logger.log('League found', FindOneLeagueUseCase.name);
      return {
        league,
      };
    } catch (err) {
      const error = new NotFoundException('Something bad happened', {
        cause: err,
        description: 'Error on find league',
      });
      this.logger.error(error.message);
      throw error;
    }
  }
}
