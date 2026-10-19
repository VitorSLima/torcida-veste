import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    Query,
    ValidationPipe,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { UpdateProductInput } from './input/update-product.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProductService } from './product.service';

@Controller('product')
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async create(
        @Body(new ValidationPipe({ whitelist: true })) data: CreateProductDto,
    ) {
        return this.productService.createProduct(data);
    }

    @Get()
    findAll(
        @Query(new ValidationPipe({ transform: true, whitelist: true }))
        query: ProductQueryDto,
    ) {
        return this.productService.findAllProducts(query);
    }

    @Get('league/:league_id')
    findAllProductsByLeague(@Param('league_id') id: string) {
        return this.productService.findAllProductsByLeague(id);
    }

    @Get('category/:category_id')
    findAllProductsByCategory(@Param('category_id') id: string) {
        return this.productService.findProductsByCategory(id);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.productService.findProductById(id);
    }

    @Patch(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async update(@Param('id') id: string, @Body() data: UpdateProductInput) {
        return this.productService.updateProduct(id, data);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    remove(@Param('id') id: string) {
        return this.productService.deleteProduct(id);
    }
}
