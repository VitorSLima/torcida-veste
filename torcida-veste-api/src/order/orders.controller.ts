import { Body, Controller, Get, Param, Post, Req, UseGuards, ValidationPipe } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { QuoteOrderDto } from './dto/quote-order.dto';
import { CreateOrderUseCase } from './use-cases/create-order.use-case';
import { FindOrderUseCase } from './use-cases/find-order.use-case';
import { ListOrdersUseCase } from './use-cases/list-orders.use-case';
import { QuoteOrderUseCase } from './use-cases/quote-order.use-case';

type AuthedRequest = { user: { userId: string; userRole?: string } };

const pipe = () => new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });

@Controller('orders')
export class OrdersController {
    constructor(
        private readonly quoteOrder: QuoteOrderUseCase,
        private readonly createOrder: CreateOrderUseCase,
        private readonly listOrders: ListOrdersUseCase,
        private readonly findOrder: FindOrderUseCase,
    ) {}

    @Throttle({ default: { limit: 120, ttl: 60_000 } })
    @Post('quote')
    quote(@Body(pipe()) dto: QuoteOrderDto) {
        return this.quoteOrder.execute(dto);
    }

    @Throttle({ default: { limit: 10, ttl: 60_000 } })
    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Req() req: AuthedRequest, @Body(pipe()) dto: CreateOrderDto) {
        return this.createOrder.execute(req.user.userId, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    list(@Req() req: AuthedRequest) {
        return this.listOrders.execute(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get(':id')
    find(@Req() req: AuthedRequest, @Param('id') id: string) {
        return this.findOrder.execute(req.user.userId, id);
    }
}
