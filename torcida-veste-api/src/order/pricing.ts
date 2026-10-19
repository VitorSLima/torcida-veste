import { DISCOUNT_TYPE } from '@prisma/client';

export type PricingLine = { price: number; originalPrice: number | null; quantity: number };
export type PricingCoupon = { discount_type: DISCOUNT_TYPE; value: number | null };
export type PricingConfig = { shippingFlat: number; freeShippingFrom: number };
export type Pricing = {
    subtotal: number;
    shipping: number;
    discount: number;
    couponDiscount: number;
    total: number;
};

export const toCents = (value: number) => Math.round(value * 100);
export const fromCents = (cents: number) => cents / 100;

function couponCents(goodsCents: number, coupon: PricingCoupon | null): number {
    if (!coupon || coupon.value == null || coupon.value <= 0) return 0;

    const raw =
        coupon.discount_type === 'PERCENTAGE'
            ? Math.round((goodsCents * Math.min(coupon.value, 100)) / 100)
            : toCents(coupon.value);

    return Math.min(raw, goodsCents);
}

export function calculatePricing(
    lines: PricingLine[],
    coupon: PricingCoupon | null,
    config: PricingConfig,
): Pricing {
    let subtotal = 0;
    let payable = 0;

    for (const line of lines) {
        const price = toCents(line.price);
        const list = line.originalPrice != null && toCents(line.originalPrice) > price ? toCents(line.originalPrice) : price;
        subtotal += list * line.quantity;
        payable += price * line.quantity;
    }

    const coupons = couponCents(payable, coupon);
    const goods = payable - coupons;
    const shipping = goods <= 0 || goods >= toCents(config.freeShippingFrom) ? 0 : toCents(config.shippingFlat);

    return {
        subtotal: fromCents(subtotal),
        shipping: fromCents(shipping),
        discount: fromCents(subtotal - payable + coupons),
        couponDiscount: fromCents(coupons),
        total: fromCents(goods + shipping),
    };
}

export function isCouponActive(coupon: { expiration_at: string }, now: Date = new Date()): boolean {
    const expires = Date.parse(coupon.expiration_at);
    return Number.isFinite(expires) && expires > now.getTime();
}
