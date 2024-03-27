import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/databases/prisma.database';
import { CreateProductInput } from '../input/create-product.input';
import { UpdateProductInput } from '../input/update-product.input';
import { PaginationParams } from '../input/pagination-params.input';

@Injectable()
export class ProductsRepository {
    constructor(private readonly prisma: PrismaService) {}

    async createProduct(data: CreateProductInput) {
        try {
            const product = this.prisma.product.create({
                data: {
                    name: data.name,
                    size: data.size,
                    description: data.description,
                    price: Number(data.price),
                    stock_status: data.stock_status,
                    category_id: data.category_id,
                    league_id: data.league_id,
                },
            });
            return product;
        } catch (error) {
            console.error(error);
        }
    }

    async findProductsByCategory(category_id: string) {
        try {
            const products = this.prisma.product.findMany({
                where: {
                    category_id,
                },
                select: {
                    id: true,
                    name: true,
                    size: true,
                    description: true,
                    price: true,
                    stock_status: true,
                    Category: {
                        select: {
                            name: true,
                        },
                    },
                    League: {
                        select: {
                            name: true,
                        },
                    },
                },
            });
            return products;
        } catch (error) {
            console.error(error);
        }
    }

    async findProductsByLeague(league_id: string) {
        try {
            const products = this.prisma.product.findMany({
                where: {
                    league_id,
                },
                select: {
                    id: true,
                    name: true,
                    size: true,
                    description: true,
                    price: true,
                    stock_status: true,
                    Category: {
                        select: {
                            name: true,
                        },
                    },
                    League: {
                        select: {
                            name: true,
                        },
                    },
                },
            });
            return products;
        } catch (error) {
            console.error(error);
        }
    }

    async findProductsById(id: string) {
        try {
            const product = this.prisma.product.findUnique({
                where: {
                    id,
                },
                select: {
                    id: true,
                    name: true,
                    size: true,
                    description: true,
                    price: true,
                    stock_status: true,
                    Category: {
                        select: {
                            name: true,
                        },
                    },
                    League: {
                        select: {
                            name: true,
                        },
                    },
                },
            });
            return product;
        } catch (error) {
            console.error(error);
        }
    }

    async findAllProducts(paginationParams: PaginationParams) {
        // const { page, limit } = paginationParams;
        try {
            const products = this.prisma.product.findMany({
                select: {
                    id: true,
                    name: true,
                    size: true,
                    description: true,
                    price: true,
                    stock_status: true,
                    Category: {
                        select: {
                            name: true,
                        },
                    },
                    League: {
                        select: {
                            name: true,
                        },
                    },
                },
                // skip: (page - 1) * limit,
                // take: Number(limit),
            });

            // const totalPages = Math.ceil(
            //     (await this.prisma.product.count()) / Number(limit),
            // );

            // return { info: { totalPages, page, limit }, products };
            return products;
        } catch (error) {
            console.error(error);
        }
    }

    async updateProduct(id: string, data: UpdateProductInput) {
        try {
            const product = await this.prisma.product.update({
                where: {
                    id,
                },
                data: {
                    name: data.name,
                    size: data.size,
                    description: data.description,
                    price: data.price,
                    stock_status: data.stock_status,
                    category_id: data.category_id,
                    league_id: data.league_id,
                },
            });
            return product;
        } catch (error) {
            console.error(error);
        }
    }

    async deleteProduct(id: string) {
        try {
            const product = this.prisma.product.delete({
                where: {
                    id,
                },
            });
            return product;
        } catch (error) {
            console.error(error);
        }
    }
}
