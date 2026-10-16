import { calculatePricing, isCouponActive, toCents } from './pricing';

const config = { shippingFlat: 5, freeShippingFrom: 300 };
const shirt = { price: 69.9, originalPrice: 139.9, quantity: 1 };
const set = { price: 159.9, originalPrice: 199.9, quantity: 1 };

describe('calculatePricing', () => {
    it('matches the mockup: 339,80 − 110,00 + 5,00 = 234,80', () => {
        expect(calculatePricing([shirt, set], null, config)).toEqual({
            subtotal: 339.8,
            shipping: 5,
            discount: 110,
            couponDiscount: 0,
            total: 234.8,
        });
    });

    it('applies a percentage coupon on the offer price and counts it in discount', () => {
        const result = calculatePricing([shirt, set], { discount_type: 'PERCENTAGE', value: 10 }, config);
        expect(result).toEqual({ subtotal: 339.8, shipping: 5, discount: 132.98, couponDiscount: 22.98, total: 211.82 });
    });

    it('applies a fixed value coupon and never exceeds the goods total', () => {
        expect(calculatePricing([shirt], { discount_type: 'VALUE', value: 20 }, config).couponDiscount).toBe(20);
        const big = calculatePricing([shirt], { discount_type: 'VALUE', value: 500 }, config);
        expect(big.couponDiscount).toBe(69.9);
        expect(big.total).toBe(0);
        expect(big.shipping).toBe(0);
    });

    it('clamps percentages to 0–100 and ignores empty values', () => {
        expect(calculatePricing([shirt], { discount_type: 'PERCENTAGE', value: 250 }, config).couponDiscount).toBe(69.9);
        expect(calculatePricing([shirt], { discount_type: 'PERCENTAGE', value: null }, config).couponDiscount).toBe(0);
        expect(calculatePricing([shirt], { discount_type: 'VALUE', value: -5 }, config).couponDiscount).toBe(0);
    });

    it('gives free shipping when goods after discounts reach the threshold', () => {
        const line = { price: 150, originalPrice: null, quantity: 2 };
        expect(calculatePricing([line], null, config)).toMatchObject({ shipping: 0, total: 300 });
        expect(calculatePricing([line], { discount_type: 'VALUE', value: 0.01 }, config)).toMatchObject({ shipping: 5, total: 304.99 });
    });

    it('treats a missing or lower originalPrice as no offer', () => {
        const result = calculatePricing([{ price: 50, originalPrice: 40, quantity: 2 }], null, config);
        expect(result).toMatchObject({ subtotal: 100, discount: 0 });
    });

    it('avoids floating point noise', () => {
        const result = calculatePricing([{ price: 0.1, originalPrice: null, quantity: 3 }], null, config);
        expect(result.subtotal).toBe(0.3);
        expect(toCents(0.3)).toBe(30);
    });

    it('returns zeros for an empty order', () => {
        expect(calculatePricing([], null, config)).toEqual({ subtotal: 0, shipping: 0, discount: 0, couponDiscount: 0, total: 0 });
    });
});

describe('isCouponActive', () => {
    const now = new Date('2026-10-16T12:00:00Z');
    it('is true before expiration', () => {
        expect(isCouponActive({ expiration_at: '2099-12-31T23:59:59.000Z' }, now)).toBe(true);
    });
    it('is false after expiration or for unparseable dates', () => {
        expect(isCouponActive({ expiration_at: '2020-01-01T00:00:00.000Z' }, now)).toBe(false);
        expect(isCouponActive({ expiration_at: 'not a date' }, now)).toBe(false);
    });
});
