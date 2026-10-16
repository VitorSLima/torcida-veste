import { BadGatewayException, HttpException, Injectable, Logger } from '@nestjs/common';
import { CreateOrderDto } from '../dto/create-order.dto';
import { ordersConfig } from '../orders.config';
import { PaymentGateway } from '../payments/payment.gateway';
import { toCents } from '../pricing';
import { OrdersRepository } from '../repository/orders.repository';
import { PrepareOrderService } from '../services/prepare-order.service';

const SESSION_MINUTES = 31; // o Stripe exige expiração de pelo menos 30 min

@Injectable()
export class CreateOrderUseCase {
    constructor(
        private readonly prepareOrder: PrepareOrderService,
        private readonly ordersRepository: OrdersRepository,
        private readonly gateway: PaymentGateway,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(userId: string, dto: CreateOrderDto) {
        const { lines, coupon, pricing } = await this.prepareOrder.prepare(dto);
        const { frontendUrl } = ordersConfig();

        const order = await this.ordersRepository.createPending({
            userId,
            couponId: coupon?.id ?? null,
            pricing,
            items: lines.map(({ product, quantity }) => ({
                productId: product.id,
                productName: product.name,
                quantity,
                unitPrice: product.price,
                originalPrice: product.originalPrice ?? null,
            })),
        });

        try {
            const session = await this.gateway.createCheckoutSession({
                orderId: order.id,
                lines: lines.map(({ product, quantity }) => {
                    const cover = product.Images.find((image) => image.is_Cover) ?? product.Images[0];
                    return {
                        name: product.name,
                        unitAmount: toCents(product.price),
                        quantity,
                        imageUrl: cover && frontendUrl.startsWith('https://') ? `${frontendUrl}${cover.url}` : undefined,
                    };
                }),
                couponAmount: toCents(pricing.couponDiscount),
                couponName: coupon?.code,
                shippingAmount: toCents(pricing.shipping),
                successUrl: `${frontendUrl}/checkout/sucesso?order=${order.id}`,
                cancelUrl: `${frontendUrl}/checkout/cancelado?order=${order.id}`,
                expiresAt: Math.floor(Date.now() / 1000) + SESSION_MINUTES * 60,
            });

            await this.ordersRepository.attachPayment(order.id, { paymentId: session.id, paymentUrl: session.url });
            this.logger.log(`Order ${order.id} created`, CreateOrderUseCase.name);
            return { orderId: order.id, payment_url: session.url };
        } catch (error) {
            await this.ordersRepository.cancel(order.id);
            this.logger.error(`Order ${order.id} canceled: payment session failed`);
            if (error instanceof HttpException) throw error;
            throw new BadGatewayException('Could not start the payment');
        }
    }
}
