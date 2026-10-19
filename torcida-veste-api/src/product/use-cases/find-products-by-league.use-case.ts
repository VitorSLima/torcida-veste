import { Injectable, Logger } from '@nestjs/common';
import { ProductsRepository } from '../repository/product.repository';
import { withDiscount } from '../product.mapper';

@Injectable()
export class FindProductByLeagueUseCase {
    constructor(
        private readonly productsRepository: ProductsRepository,
        private readonly logger: Logger = new Logger(
            FindProductByLeagueUseCase.name,
        ),
    ) {}

    async execute(leagueId: string) {
        const products =
            await this.productsRepository.findProductsByLeague(leagueId);

        this.logger.log('Products found', FindProductByLeagueUseCase.name);
        return products.map(withDiscount);
    }
}
