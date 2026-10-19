import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../repository/users.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly logger: Logger = new Logger(),
  ) {}

  async execute(id: string, data: Prisma.UserUpdateInput) {
    const user = await this.usersRepository.findUserById(id);
    if (!user) {
      const error = new NotFoundException('User not found');
      this.logger.error(error.message);
      throw error;
    }
    let updated;
    try {
        updated = await this.usersRepository.updateUser(id, data);
        this.logger.log('User updated', UpdateUserUseCase.name);
    } catch (err) {
        const error = new NotFoundException('Something bad happened', {
            cause: err,
            description: 'Error on updating user',
        });
        this.logger.error(error.message);
        throw error;
    }
    return { ...updated, password: undefined };
  }
}
