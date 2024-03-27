import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ProductsRepository } from '../repository/product.repository';
import { PaginationParams } from '../input/pagination-params.input';

@Injectable()
export class FindAllProductsUseCase {
    constructor(
        private readonly productsRepository: ProductsRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(paginationParams: PaginationParams) {
        try {
            const products = await this.productsRepository.findAllProducts(paginationParams);

            if (!products) {
                const error = new NotFoundException('Product not found');
                this.logger.error(error.message);
                throw error;
            }
            this.logger.log('Products found', FindAllProductsUseCase.name);
            return {
                products,
            };
        } catch (err) {
            const error = new NotFoundException('Something bad happened', {
                cause: err,
                description: 'Error on find product',
            });
            this.logger.error(error.message);
            throw error;
        }
    }
}
