import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/databases/prisma.database';
import { CreateCategoryInput } from '../input/create-category.input';
import { UpdateCategoryInput } from '../input/update-category.input';

@Injectable()
export class CategoriesRepository {
    constructor(private readonly prisma: PrismaService) {}

    async createCategory(data: CreateCategoryInput) {
        try {
            const category = await this.prisma.category.create({
                data: {
                    name: data.name,
                },
            });
            return category;
        } catch (error) {
            console.error(error);
        }
    }

    async findAllCategories() {
        try {
            const categories = await this.prisma.category.findMany();
            return categories;
        } catch (error) {
            console.error(error);
        }
    }

    async findOneCategory(id: string) {
        try {
            const category = await this.prisma.category.findUnique({
                where: {
                    id,
                },
            });
            return category;
        } catch (error) {
            console.error(error);
        }
    }

    async findCategoryById(id: string) {
        try {
            const category = await this.prisma.category.findFirst({
                where: {
                    id: {
                        equals: id,
                    },
                },
            });
            return category;
        } catch (error) {
            console.error(error);
        }
    }

    async updateCategory(id: string, data: UpdateCategoryInput) {
        try {
            const category = await this.prisma.category.update({
                where: {
                    id,
                },
                data: {
                    name: data.name,
                },
            });
            return category;
        } catch (error) {
            console.error(error);
        }
    }

    async deleteCategory(id: string) {
        const category = await this.prisma.category.delete({
            where: {
                id,
            },
        });
        return category;
    }
}
