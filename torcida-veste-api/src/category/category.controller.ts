import {
    Body,
    Controller,
    Delete,
    Get,
    Injectable,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryInput } from './input/update-category.input';
import { CategoryService } from './category.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Injectable()
@Controller('category')
@UseGuards(JwtAuthGuard)
@Roles('ADMIN')
export class CategoryController {
    constructor(private readonly categoryService: CategoryService) {}

    @Post()
    create(@Body() data: CreateCategoryDto) {
        return this.categoryService.createCategory(data);
    }
    @Get()
    findAll() {
        return this.categoryService.findAllCategories();
    }
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.categoryService.findOneCategory(id);
    }
    @Patch(':id')
    update(@Param('id') id: string, @Body() data: UpdateCategoryInput) {
        return this.categoryService.updateCategory(id, data);
    }
    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.categoryService.deleteCategory(id);
    }
}
