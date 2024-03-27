import { BadRequestException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { CreateProductInput } from '../input/create-product.input';
import { ProductsRepository } from '../repository/product.repository';

@Injectable()
export class CreateProductUseCase {
    constructor(
        private readonly productsRepository: ProductsRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(data: CreateProductInput) {
        try {
            const product = await this.productsRepository.createProduct(data);
            this.logger.log('Product created', CreateProductUseCase.name);
            return product;
        } catch (err) {
                const error = new ServiceUnavailableException(
                    'Something bad happened',
                    {
                        cause: err,
                        description: 'Error creating product',
                    },
                );
            this.logger.error(err.message);
            throw error;
        }
    }
}
