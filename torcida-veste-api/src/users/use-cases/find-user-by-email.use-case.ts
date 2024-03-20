import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../repository/users.repository';

@Injectable()
export class FindUserByEmailUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly logger: Logger = new Logger(),
  ) {}

  async execute(email: string) {
    const user = await this.usersRepository.findUserByEmail(email);

    if (!user) {
      const error = new NotFoundException('User not found');
      this.logger.error(error.message);
      throw error;
    }
    this.logger.log('User found', FindUserByEmailUseCase.name);
    return user;
  }
}
