import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UsersRepository } from '../repository/users.repository';

@Injectable()
export class FindAllUsersUseCase {
    constructor(
        private readonly usersRepository: UsersRepository,
        private readonly logger: Logger = new Logger(FindAllUsersUseCase.name),
    ) {}

    async execute() {
        const user = await this.usersRepository.findAllUsers();

        if (!user) {
            const error = new NotFoundException('User not found');
            this.logger.error(error.message);
            throw error;
        }
        this.logger.log('User found', FindAllUsersUseCase.name);
        return {
            ...user,
            password: undefined,
        };
    }
}
