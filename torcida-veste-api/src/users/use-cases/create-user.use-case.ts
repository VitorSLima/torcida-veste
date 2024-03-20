import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { UsersRepository } from '../repository/users.repository';
import { Prisma } from '@prisma/client';

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly logger: Logger = new Logger(),
  ) {}

  async execute(data: Prisma.UserCreateInput) {
    try {
      const user = await this.usersRepository.createUser(data);
      this.logger.log('User created', CreateUserUseCase.name);
      return user;
    } catch (err) {
      const error = new ServiceUnavailableException('Something bad happened', {
        cause: err,
        description: 'Error creating user',
      });
      this.logger.error(error.message);
      throw error;
    }
  }
}
