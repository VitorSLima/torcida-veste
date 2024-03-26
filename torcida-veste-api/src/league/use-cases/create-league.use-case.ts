import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CreateLeagueInput } from '../input/create-league.input';
import { LeaguesRepository } from '../repository/league.repository';

@Injectable()
export class CreateLeagueUseCase {
    constructor(
        private readonly leaguesRepository: LeaguesRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(data: CreateLeagueInput) {
        try {
            const existingLeague =
                await this.leaguesRepository.findLeagueById(data.name);

            if (existingLeague) {
                const error = new BadRequestException('League already exists');
                this.logger.error(error.message);
                throw error;
            }
            const league = await this.leaguesRepository.createLeague(data);
            this.logger.log('League created', CreateLeagueUseCase.name);
            return league;
        } catch (err) {
            const error = new ServiceUnavailableException(
                'Something bad happened',
                {
                    cause: err,
                    description: 'Error creating league',
                },
            );
            this.logger.error(error.message);
            throw error;
        }
    }
}

