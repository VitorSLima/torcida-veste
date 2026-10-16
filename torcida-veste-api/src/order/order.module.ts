import { Logger, Module } from '@nestjs/common';
import { CouponModule } from '../coupon/coupon.module';
import { ProductModule } from '../product/product.module';
import { OrdersController } from './orders.controller';
import { PaymentsController } from './payments.controller';
import { PaymentGateway } from './payments/payment.gateway';
import { StripeGateway } from './payments/stripe.gateway';
import { OrdersRepository } from './repository/orders.repository';
import { PrepareOrderService } from './services/prepare-order.service';
import { CreateOrderUseCase } from './use-cases/create-order.use-case';
import { FindOrderUseCase } from './use-cases/find-order.use-case';
import { HandlePaymentEventUseCase } from './use-cases/handle-payment-event.use-case';
import { ListOrdersUseCase } from './use-cases/list-orders.use-case';
import { QuoteOrderUseCase } from './use-cases/quote-order.use-case';

@Module({
    imports: [ProductModule, CouponModule],
    controllers: [OrdersController, PaymentsController],
    providers: [
        OrdersRepository,
        PrepareOrderService,
        QuoteOrderUseCase,
        CreateOrderUseCase,
        ListOrdersUseCase,
        FindOrderUseCase,
        HandlePaymentEventUseCase,
        Logger,
        { provide: PaymentGateway, useClass: StripeGateway },
    ],
})
export class OrderModule {}
