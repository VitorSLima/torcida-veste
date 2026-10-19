import { Injectable, Logger } from '@nestjs/common';
import { ProductsRepository } from '../repository/product.repository';
import { ProductQueryDto } from '../dto/product-query.dto';
import { withDiscount } from '../product.mapper';

@Injectable()
export class FindAllProductsUseCase {
    constructor(
        private readonly productsRepository: ProductsRepository,
        private readonly logger: Logger = new Logger(FindAllProductsUseCase.name),
    ) {}

    async execute(query: ProductQueryDto) {
        const { products, total } =
            await this.productsRepository.findAllProducts(query);

        this.logger.log('Products found', FindAllProductsUseCase.name);

        return {
            products: products.map(withDiscount),
            info: {
                page: query.page,
                limit: query.limit,
                total,
                totalPages: Math.ceil(total / query.limit),
            },
        };
    }
}
