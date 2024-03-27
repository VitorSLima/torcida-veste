import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ProductsRepository } from '../repository/product.repository';

@Injectable()
export class FindProductByPricePromoUseCase {
    constructor(
        private readonly productsRepository: ProductsRepository,
        private readonly logger: Logger = new Logger(
            FindProductByPricePromoUseCase.name,
        ),
    ) {}

    async execute() {
        try {
            const products = await this.productsRepository.findProductsInPricePromo();
            if (!products) {
                const error = new NotFoundException('Products not found');
                throw error;
            }

            this.logger.log('Products found', FindProductByPricePromoUseCase.name);
            return products;
        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    }
}
