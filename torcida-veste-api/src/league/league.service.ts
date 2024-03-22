import { Injectable } from '@nestjs/common';
import { CreateLeagueUseCase, DeleteLeagueUseCase, FindAllLeaguesUseCase, FindOneLeagueUseCase, UpdateLeagueUseCase } from './use-cases';
import { UpdateLeagueInput } from './input/update-league.input';
import { CreateLeagueInput } from './input/create-league.input';


@Injectable()
export class LeagueService {
  constructor(
    private readonly findAllLeagueUseCase: FindAllLeaguesUseCase,
    private readonly findOneLeagueUseCase: FindOneLeagueUseCase,
    private readonly updateLeagueUseCase: UpdateLeagueUseCase,
    private readonly deleteLeagueUseCase: DeleteLeagueUseCase,
    private readonly createLeagueUseCase: CreateLeagueUseCase,
  ) { }

  async createLeague(data: CreateLeagueInput) {
    return await this.createLeagueUseCase.execute(data);
  }

  async findAllLeagues() {
    return await this.findAllLeagueUseCase.execute();
  }

  async findOneLeague(id: string) {
    return await this.findOneLeagueUseCase.execute(id);
  }

  async updateLeague(id: string, data: UpdateLeagueInput) {
    return await this.updateLeagueUseCase.execute(id, data);
  }

  async deleteLeague(id: string) {
    return await this.deleteLeagueUseCase.execute(id);
  }
}
