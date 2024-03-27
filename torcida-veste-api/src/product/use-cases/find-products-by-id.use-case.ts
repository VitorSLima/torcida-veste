import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ProductsRepository } from '../repository/product.repository';

@Injectable()
export class FindProductByIdUseCase {
    constructor(
        private readonly productsRepository: ProductsRepository,
        private readonly logger: Logger = new Logger(
            FindProductByIdUseCase.name,
        ),
    ) {}

    async execute(id: string) {
        try {
            const product = await this.productsRepository.findProductsById(id);
            if (!product) {
                const error = new NotFoundException('Product not found');
                this.logger.error(error.message);
                throw error;
            }
            this.logger.log('Product found', FindProductByIdUseCase.name);
            return {
                product,
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
