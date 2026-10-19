import { BadRequestException, Injectable } from '@nestjs/common';
import { Coupon } from '@prisma/client';
import { CouponsRepository } from '../../coupon/repository/coupon.repository';
import { ProductsRepository } from '../../product/repository/product.repository';
import { CartIssue, CartOutdatedException } from '../errors/cart-outdated.exception';
import { ordersConfig } from '../orders.config';
import { calculatePricing, isCouponActive, toCents } from '../pricing';

export type PrepareInput = {
    items: { productId: string; quantity: number; unitPrice?: number }[];
    couponCode?: string;
};

@Injectable()
export class PrepareOrderService {
    constructor(
        private readonly productsRepository: ProductsRepository,
        private readonly couponsRepository: CouponsRepository,
    ) {}

    async prepare(input: PrepareInput) {
        const ids = input.items.map((item) => item.productId);
        if (new Set(ids).size !== ids.length) {
            throw new BadRequestException('Duplicate products in order');
        }

        const products = await this.productsRepository.findProductsByIds(ids);
        const byId = new Map(products.map((product) => [product.id, product]));

        const issues: CartIssue[] = [];
        const lines = input.items.flatMap((item) => {
            const product = byId.get(item.productId);

            if (!product) {
                issues.push({ productId: item.productId, reason: 'NOT_FOUND' });
                return [];
            }
            if (product.stock_status !== 'IN_STOCK') {
                issues.push({ productId: item.productId, reason: 'OUT_OF_STOCK' });
                return [];
            }
            if (item.unitPrice != null && toCents(item.unitPrice) !== toCents(product.price)) {
                issues.push({
                    productId: item.productId,
                    reason: 'PRICE_CHANGED',
                    price: product.price,
                    originalPrice: product.originalPrice ?? null,
                });
                return [];
            }
            return [{ product, quantity: item.quantity }];
        });

        if (issues.length > 0) throw new CartOutdatedException(issues);

        let coupon: Coupon | null = null;
        const code = input.couponCode?.trim();
        if (code) {
            const found = await this.couponsRepository.findCouponByCode(code);
            if (!found || !isCouponActive(found)) {
                throw new BadRequestException('Invalid or expired coupon');
            }
            coupon = found;
        }

        const pricing = calculatePricing(
            lines.map(({ product, quantity }) => ({
                price: product.price,
                originalPrice: product.originalPrice ?? null,
                quantity,
            })),
            coupon,
            ordersConfig(),
        );

        return { lines, coupon, pricing };
    }
}
