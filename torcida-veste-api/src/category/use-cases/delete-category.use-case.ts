import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CategoriesRepository } from '../repository/category.repository';

@Injectable()
export class DeleteCategoryUseCase {
  constructor(
    private readonly categoriesRepository: CategoriesRepository,
    private readonly logger: Logger = new Logger(),
  ) {}

  async execute(id: string) {
    const category = this.categoriesRepository.findCategoryById(id);
    if (!category) {
      const error = new NotFoundException('Category not found');
      this.logger.error(error.message);
      throw error;
    }
    try {
        this.categoriesRepository.deleteCategory(id);
        this.logger.log('Category deleted', DeleteCategoryUseCase.name);
    } catch (err) {
        const error = new NotFoundException('Something bad happened', {
            cause: err,
            description: 'Error on deleting category',
        });
        this.logger.error(error.message);
        throw error;
    }
    return category;
  }
}
