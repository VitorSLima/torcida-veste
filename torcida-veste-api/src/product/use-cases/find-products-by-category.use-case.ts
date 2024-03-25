import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ProductsRepository } from '../repository/product.repository';

@Injectable()
export class FindProductByCategoryUseCase {
    constructor(
        private readonly productsRepository: ProductsRepository,
        private readonly logger: Logger = new Logger(
            FindProductByCategoryUseCase.name,
        ),
    ) {}

    async execute(data: string) {
        try {
            const products =
                await this.productsRepository.findProductsByCategory(data);
            if (!products) {
                const error = new NotFoundException('Produtos não encontrados');
                throw error;
            }

            this.logger.log(
                'Products found',
                FindProductByCategoryUseCase.name,
            );
            return products;
        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    }
}
