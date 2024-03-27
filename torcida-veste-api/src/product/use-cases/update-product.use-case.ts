import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UpdateProductInput } from '../input/update-product.input';
import { ProductsRepository } from '../repository/product.repository';

@Injectable()
export class UpdateProductUseCase {
    constructor(
        private readonly productsRepository: ProductsRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(id: string, data: UpdateProductInput) {
        try {
            const product = await this.productsRepository.findProductsById(id);
            if (!product) {
                const error = new NotFoundException('Product not found');
                this.logger.error(error.message);
                throw error;
            }
            this.productsRepository.updateProduct(id, data);
            this.logger.log('Product updated', UpdateProductUseCase.name);
            return product;
        } catch (err) {
            const error = new NotFoundException('Something bad happened', {
                cause: err,
                description: 'Error on updating product',
            });
            this.logger.error(error.message);
            throw error;
        }
    }
}
