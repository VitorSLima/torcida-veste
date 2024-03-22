import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/databases/prisma.database';
import { CreateLeagueInput } from '../input/create-league.input';
import { UpdateLeagueInput } from '../input/update-league.input';

@Injectable()
export class LeaguesRepository {
  constructor(private readonly prisma: PrismaService) { }

  async createLeague(data: CreateLeagueInput) {
    try {
      const league = await this.prisma.league.create({
        data: {
          name: data.name,
        },
      });
      return league;
    } catch (error) {
      console.error(error);
    }
  }

  async findAllLeagues() {
    try {
      const leagues = await this.prisma.league.findMany();
      return leagues;
    } catch (error) {
      console.error(error);
    }
  }

  async findOneLeague(id: string) {
    try {
      const league = await this.prisma.league.findUnique({
        where: {
          id
        },
      });
      return league;
    } catch (error) {
      console.error(error);
    }
  }


  async findLeagueById(id: string) {
    try {
      const product = await this.prisma.league.findUnique({
        where: {
            id,
        },
      });
      return product;
    } catch (error) {
      console.error(error);
    }
  }

  async updateLeague(id: string, data: UpdateLeagueInput) {
    try {
      const league = await this.prisma.league.update({
        where: {
          id,
        },
        data: {
          name: data.name,
        },
      });
      return league;
    } catch (error) {
      console.error(error);
    }
  }

  async deleteLeague(id: string) {
    const league = await this.prisma.league.delete({
      where: {
        id,
      },
    });
    return league;
  }
}
