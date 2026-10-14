import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/databases/prisma.database';
import { CreateProductInput } from '../input/create-product.input';
import { UpdateProductInput } from '../input/update-product.input';
import { ProductQueryDto } from '../dto/product-query.dto';

const productSelect = {
    id: true,
    name: true,
    size: true,
    description: true,
    price: true,
    originalPrice: true,
    stock_status: true,
    Category: { select: { id: true, name: true } },
    League: { select: { id: true, name: true } },
    Images: {
        select: { id: true, url: true, is_Cover: true },
        orderBy: { is_Cover: 'desc' as const },
    },
} satisfies Prisma.ProductSelect;

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
                    originalPrice:
                        data.originalPrice != null ? Number(data.originalPrice) : null,
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
        return this.prisma.product.findMany({
            where: { category_id },
            select: productSelect,
            orderBy: { name: 'asc' },
        });
    }

    async findProductsByLeague(league_id: string) {
        return this.prisma.product.findMany({
            where: { league_id },
            select: productSelect,
            orderBy: { name: 'asc' },
        });
    }

    async findProductsById(id: string) {
        return this.prisma.product.findUnique({
            where: { id },
            select: productSelect,
        });
    }

    async findAllProducts(query: ProductQueryDto) {
        const { page, limit, search, onSale, categoryId, leagueId } = query;

        const where: Prisma.ProductWhereInput = {
            ...(search && { name: { contains: search, mode: 'insensitive' } }),
            ...(categoryId && { category_id: categoryId }),
            ...(leagueId && { league_id: leagueId }),
            ...(onSale && {
                originalPrice: { not: null },
                price: { lt: this.prisma.product.fields.originalPrice },
            }),
        };

        const [products, total] = await this.prisma.$transaction([
            this.prisma.product.findMany({
                where,
                select: productSelect,
                orderBy: { name: 'asc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.product.count({ where }),
        ]);

        return { products, total };
    }

    async updateProduct(id: string, data: UpdateProductInput) {
        try {
            const product = await this.prisma.product.update({
                where: { id },
                data: {
                    name: data.name,
                    size: data.size,
                    description: data.description,
                    price: data.price,
                    originalPrice: data.originalPrice,
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
        return this.prisma.$transaction([
            this.prisma.image.deleteMany({ where: { product_id: id } }),
            this.prisma.product.delete({ where: { id } }),
        ]);
    }
}
