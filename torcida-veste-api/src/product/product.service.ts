import { Injectable } from '@nestjs/common';
import {
    CreateProductUseCase,
    DeleteProductUseCase,
    FindAllProductsUseCase,
    FindProductByCategoryUseCase,
    FindProductByIdUseCase,
    FindProductByLeagueUseCase,
    UpdateProductUseCase,
} from './use-cases';
import { CreateProductInput } from './input/create-product.input';
import { UpdateProductInput } from './input/update-product.input';
import { ProductQueryDto } from './dto/product-query.dto';

@Injectable()
export class ProductService {
    constructor(
        private readonly createProductUseCase: CreateProductUseCase,
        private readonly updateProductUseCase: UpdateProductUseCase,
        private readonly deleteProductUseCase: DeleteProductUseCase,
        private readonly findProductByIdUseCase: FindProductByIdUseCase,
        private readonly findAllProductsUseCase: FindAllProductsUseCase,
        private readonly findProductByLeagueUseCase: FindProductByLeagueUseCase,
        private readonly findProductByCategoryUseCase: FindProductByCategoryUseCase,
    ) {}

    async createProduct(data: CreateProductInput) {
        return await this.createProductUseCase.execute(data);
    }

    async findProductById(id: string) {
        return await this.findProductByIdUseCase.execute(id);
    }

    async findAllProductsByLeague(league_id: string) {
        return await this.findProductByLeagueUseCase.execute(league_id);
    }

    async findProductsByCategory(data: string) {
        return await this.findProductByCategoryUseCase.execute(data);
    }

    async findAllProducts(query: ProductQueryDto) {
        return await this.findAllProductsUseCase.execute(query);
    }

    async updateProduct(id: string, data: UpdateProductInput) {
        return await this.updateProductUseCase.execute(id, data);
    }

    async deleteProduct(id: string) {
        return await this.deleteProductUseCase.execute(id);
    }
}
