import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ProductsRepository } from '../repository/product.repository';
import { withDiscount } from '../product.mapper';

@Injectable()
export class FindProductByIdUseCase {
    constructor(
        private readonly productsRepository: ProductsRepository,
        private readonly logger: Logger = new Logger(FindProductByIdUseCase.name),
    ) {}

    async execute(id: string) {
        const product = await this.productsRepository.findProductsById(id);

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        this.logger.log('Product found', FindProductByIdUseCase.name);
        return { product: withDiscount(product) };
    }
}
