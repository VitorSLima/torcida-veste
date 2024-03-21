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
import { RolesGuard } from '../auth/guards/role.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Injectable()
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) { }
  
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() data: CreateCategoryDto) {
    return this.categoryService.createCategory(data);
  }
  @Get()
  findAll() {
    return this.categoryService.findAllCategories();
  }
  @Get(':id')
  findOne(id: string) {
    return this.categoryService.findOneCategory(id);
  }
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() data: UpdateCategoryInput) {
    return this.categoryService.updateCategory(id, data);
  }
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  delete(@Param('id') id: string) {
    return this.categoryService.deleteCategory(id);
  }
}
