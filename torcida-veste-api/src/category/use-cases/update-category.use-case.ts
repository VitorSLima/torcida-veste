import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { UpdateCategoryInput } from '../input/update-category.input';
import { CategoriesRepository } from '../repository/category.repository';

@Injectable()
export class UpdateCategoryUseCase {
  constructor(
    private readonly categoriesRepository: CategoriesRepository,
    private readonly logger: Logger = new Logger(),
  ) {}

  async execute(id: string, data: UpdateCategoryInput) {
    try {
      const category = await this.categoriesRepository.findCategoryById(id);
      if (!category) {
        const error = new NotFoundException('Category not found');
        this.logger.error(error.message);
        throw error;
      }
      this.categoriesRepository.updateCategory(id, data);
      this.logger.log('Category updated', UpdateCategoryUseCase.name);
      return category;
    } catch (err) {
      const error = new NotFoundException('Something bad happened', {
        cause: err,
        description: 'Error on updating category',
      });
      this.logger.error(error.message);
      throw error;
    }
  }
}
