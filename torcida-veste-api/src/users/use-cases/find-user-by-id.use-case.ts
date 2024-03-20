import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../repository/users.repository';

@Injectable()
export class FindUserByIdUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly logger: Logger = new Logger(FindUserByIdUseCase.name),
  ) {}

  async execute(id: string) {
    const user = await this.usersRepository.findUserById(id);

    if (!user) {
      const error = new NotFoundException('User not found');
      this.logger.error(error.message);
      throw error;
    }
    this.logger.log('User found', FindUserByIdUseCase.name);
    return {
      ...user,
      password: undefined,
    };
  }
}
