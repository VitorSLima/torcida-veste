import {
    Injectable,
    Logger,
    ServiceUnavailableException,
} from '@nestjs/common';
import { CreateCategoryInput } from '../input/create-category.input';
import { CategoriesRepository } from '../repository/category.repository';

@Injectable()
export class CreateCategoryUseCase {
    constructor(
        private readonly categoriesRepository: CategoriesRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(data: CreateCategoryInput) {
        try {
            const category =
                await this.categoriesRepository.createCategory(data);
            this.logger.log('Category created', CreateCategoryUseCase.name);
            return category;
        } catch (err) {
            const error = new ServiceUnavailableException(
                'Something bad happened',
                {
                    cause: err,
                    description: 'Error creating category',
                },
            );
            this.logger.error(error.message);
            throw error;
        }
    }
}
