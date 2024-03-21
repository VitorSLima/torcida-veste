import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CategoriesRepository } from '../repository/category.repository';

@Injectable()
export class FindAllCategoriesUseCase {
  constructor(
    private readonly categoriesRepository: CategoriesRepository,
    private readonly logger: Logger = new Logger(FindAllCategoriesUseCase.name),
  ) {}

  async execute() {
    const category = await this.categoriesRepository.findAllCategories();

    if (!category) {
      const error = new NotFoundException('Category not found');
      this.logger.error(error.message);
      throw error;
    }
    this.logger.log('Category found', FindAllCategoriesUseCase.name);
    return category;
  }
}
