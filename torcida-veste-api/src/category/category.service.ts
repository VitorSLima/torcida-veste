import { Injectable } from '@nestjs/common';
import { CreateCategoryInput } from './input/create-category.input';
import { UpdateCategoryInput } from './input/update-category.input';
import { CreateCategoryUseCase } from './use-cases/create-category.use-case';
import { DeleteCategoryUseCase } from './use-cases/delete-category.use-case';
import { UpdateCategoryUseCase } from './use-cases/update-category.use-case';
import { FindAllCategoriesUseCase } from './use-cases/find-all-categories.use-case';


@Injectable()
export class CategoryService {
  constructor(
    private readonly findAllCategoryUseCase: FindAllCategoriesUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
    private readonly createCategoryUseCase: CreateCategoryUseCase,
  ) { }

  async createCategory(data: CreateCategoryInput) {
    return await this.createCategoryUseCase.execute(data);
  }

  async findAllCategories() {
    return await this.findAllCategoryUseCase.execute();
  }

  async updateCategory(id: string, data: UpdateCategoryInput) {
    return await this.updateCategoryUseCase.execute(id, data);
  }

  async deleteCategory(id: string) {
    return await this.deleteCategoryUseCase.execute(id);
  }
}
