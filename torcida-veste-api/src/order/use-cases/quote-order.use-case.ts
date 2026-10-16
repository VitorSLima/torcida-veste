import { Injectable } from '@nestjs/common';
import { QuoteOrderDto } from '../dto/quote-order.dto';
import { PrepareOrderService } from '../services/prepare-order.service';

@Injectable()
export class QuoteOrderUseCase {
    constructor(private readonly prepareOrder: PrepareOrderService) {}

    async execute(dto: QuoteOrderDto) {
        const { lines, coupon, pricing } = await this.prepareOrder.prepare(dto);

        return {
            items: lines.map(({ product, quantity }) => ({
                productId: product.id,
                name: product.name,
                quantity,
                unitPrice: product.price,
                originalPrice: product.originalPrice ?? null,
            })),
            ...pricing,
            coupon: coupon ? { code: coupon.code } : null,
        };
    }
}
