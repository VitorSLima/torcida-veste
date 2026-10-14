import { Injectable, Logger } from '@nestjs/common';
import { ProductsRepository } from '../repository/product.repository';
import { withDiscount } from '../product.mapper';

@Injectable()
export class FindProductByCategoryUseCase {
    constructor(
        private readonly productsRepository: ProductsRepository,
        private readonly logger: Logger = new Logger(
            FindProductByCategoryUseCase.name,
        ),
    ) {}

    async execute(categoryId: string) {
        const products =
            await this.productsRepository.findProductsByCategory(categoryId);

        this.logger.log('Products found', FindProductByCategoryUseCase.name);
        return products.map(withDiscount);
    }
}
