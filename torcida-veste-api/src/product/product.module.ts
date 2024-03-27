import { Logger, Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import * as UseCases from './use-cases';
import { ProductsRepository } from './repository/product.repository';

const usecases = Object.values(UseCases);
@Module({
    imports: [],
    controllers: [ProductController],
    providers: [ProductService, ProductsRepository, ...usecases, Logger],
    exports: [ProductService, ProductsRepository],
})
export class ProductModule {}
