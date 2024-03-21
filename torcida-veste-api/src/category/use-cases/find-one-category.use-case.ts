import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CategoriesRepository } from '../repository/category.repository';

@Injectable()
export class FindOneCategoryUseCase {
  constructor(
    private readonly categoriesRepository: CategoriesRepository,
    private readonly logger: Logger = new Logger(FindOneCategoryUseCase.name),
  ) {}

  async execute(id: string) {
    const category = await this.categoriesRepository.findOneCategory(id);

    if (!category) {
      const error = new NotFoundException('Category not found');
      this.logger.error(error.message);
      throw error;
    }
    this.logger.log('Category found', FindOneCategoryUseCase.name);
    return category;
  }
}
