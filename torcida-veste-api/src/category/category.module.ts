import { Logger, Module } from '@nestjs/common';
import * as UseCases from './use-cases';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { CategoriesRepository } from './repository/category.repository';

const usecases = Object.values(UseCases);

@Module({
  imports: [],
  controllers: [CategoryController],
  providers: [CategoryService, CategoriesRepository, ...usecases, Logger],
  exports: [CategoryService, CategoriesRepository],
})
export class CategoryModule {}
