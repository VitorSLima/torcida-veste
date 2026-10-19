import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/databases/prisma.database';

@Injectable()
export class UsersRepository {
    constructor(private readonly prisma: PrismaService) {}

    async findAllUsers() {
        return await this.prisma.user.findMany({
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                document: true,
                phone: true,
                role: true,
                picture: true,
                Address: {
                    select: {
                        zipCode: true,
                        street: true,
                        number: true,
                        city: true,
                        state: true,
                    },
                },
            },
        });
    }

    async findUserByEmail(email: string) {
        return await this.prisma.user.findUnique({
            where: { email },
        });
    }

    async findUserById(id: string) {
        return await this.prisma.user.findUnique({
            where: { id },
        });
    }

    async createUser(data: Prisma.UserCreateInput) {
        return await this.prisma.user.create({
            data,
        });
    }

    async updateUser(id: string, data: Prisma.UserUpdateInput) {
        return await this.prisma.user.update({
            where: { id },
            data,
        });
    }

    async deleteUser(id: string) {
        return await this.prisma.user.delete({
            where: { id },
        });
    }
}
