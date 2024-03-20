import { Injectable } from '@nestjs/common';
import {
  CreateUserUseCase,
  DeleteUserUseCase,
  FindUserByEmailUseCase,
  FindUserByIdUseCase,
  UpdateUserUseCase,
} from './use-cases';
import { Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly findUserByEmailUseCase: FindUserByEmailUseCase,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  async findUserById(id: string) {
    return await this.findUserByIdUseCase.execute(id);
  }

  async findUserByEmail(email: string) {
    return await this.findUserByEmailUseCase.execute(email);
  }

  async createUser(data: Prisma.UserCreateInput) {
    return await this.createUserUseCase.execute(data);
  }

  async updateUser(id: string, data: Prisma.UserUpdateInput) {
    return await this.updateUserUseCase.execute(id, data);
  }

  async deleteUser(id: string) {
    return await this.deleteUserUseCase.execute(id);
  }
}
