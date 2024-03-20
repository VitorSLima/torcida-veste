import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../repository/users.repository';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly logger: Logger = new Logger(),
  ) {}

  async execute(id: string) {
    const user = await this.usersRepository.findUserById(id);
    if (!user) {
      const error = new NotFoundException('User not found');
      this.logger.error(error.message);
      throw error;
    }
    try {
      await this.usersRepository.deleteUser(id);
      this.logger.log('User deleted', DeleteUserUseCase.name);
    } catch (err) {
      const error = new NotFoundException('Something bad happened', {
        cause: err,
        description: 'Error on deleting user',
      });
      this.logger.error(error.message);
      throw error;
    }
  }
}
