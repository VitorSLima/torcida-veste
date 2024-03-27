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
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductInput } from './input/update-product.input';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProductService } from './product.service';
import { PaginationParams } from './input/pagination-params.input';

@Controller('product')
export class ProductController {
    constructor(private readonly productService: ProductService) {}

    @UseGuards(JwtAuthGuard)
    @Roles('ADMIN')
    @Post()
    async create(@Body() data: CreateProductDto) {
        const product = await this.productService.createProduct(data);
        return product;
    }

    @Get()
    findAll(@Query() paginationParams: PaginationParams) {
        return this.productService.findAllProducts(paginationParams);
    }

    @Get('price-promo')
    findAllProductsByPricePromo() {
        return this.productService.findProductsByPricePromo();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.productService.findProductById(id);
    }

    @Get('league/:league_id')
    findAllProductsByLeague(@Param('league_id') id: string) {
        return this.productService.findAllProductsByLeague(id);
    }

    @Get('category/:category_id')
    findAllCategoriesByLeague(@Param('category_id') id: string) {
        return this.productService.findProductsByCategory(id);
    }

    @UseGuards(JwtAuthGuard)
    @Roles('ADMIN')
    @Patch(':id')
    async update(@Param('id') id: string, @Body() data: UpdateProductInput) {
        return this.productService.updateProduct(id, data);
    }

    @UseGuards(JwtAuthGuard)
    @Roles('ADMIN')
    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.productService.deleteProduct(id);
    }
}
