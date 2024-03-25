import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ProductsRepository } from '../repository/product.repository';

@Injectable()
export class FindProductByLeagueUseCase {
    constructor(
        private readonly productsRepository: ProductsRepository,
        private readonly logger: Logger = new Logger(
            FindProductByLeagueUseCase.name,
        ),
    ) {}

    async execute(data: string) {
        try {
            const products =
                await this.productsRepository.findProductsByLeague(data);
            if (!products) {
                const error = new NotFoundException('Produtos não encontrados');
                throw error;
            }

            this.logger.log('Products found', FindProductByLeagueUseCase.name);
            return products;
        } catch (error) {
            this.logger.error(error);
            throw error;
        }
    }
}
