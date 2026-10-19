import {
    ConflictException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { ProductsRepository } from '../repository/product.repository';

@Injectable()
export class DeleteProductUseCase {
    constructor(
        private readonly productsRepository: ProductsRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(id: string) {
        const product = await this.productsRepository.findProductsById(id);
        if (!product) {
            const error = new NotFoundException('Product not found');
            this.logger.error(error.message);
            throw error;
        }

        try {
            await this.productsRepository.deleteProduct(id);
        } catch (err) {
            if (err?.code === 'P2003') {
                const error = new ConflictException(
                    'Product is part of existing orders',
                );
                this.logger.error(error.message);
                throw error;
            }
            this.logger.error('Error on deleting product');
            throw err;
        }

        this.logger.log('Product deleted', DeleteProductUseCase.name);
        return { product };
    }
}
