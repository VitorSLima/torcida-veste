import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ProductsRepository } from '../repository/product.repository';

@Injectable()
export class DeleteProductUseCase {
    constructor(
        private readonly productsRepository: ProductsRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(id: string) {
        const product = this.productsRepository.deleteProduct(id);
        if (!product) {
            const error = new NotFoundException('Product not found');
            this.logger.error(error.message);
            throw error;
        }

        try {
            this.productsRepository.deleteProduct(id);
            this.logger.log('Product deleted', DeleteProductUseCase.name);
        } catch (err) {
            const error = new NotFoundException('Something bad happened', {
                cause: err,
                description: 'Error on deleting product',
            });
            this.logger.error(error.message);
            throw error;
        }
    }
}
