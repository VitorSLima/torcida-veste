import { withDiscount } from './product.mapper';

describe('withDiscount', () => {
    it('computes a rounded percentage when originalPrice is above price', () => {
        const result = withDiscount({ id: 'p1', price: 69.9, originalPrice: 139.9 });
        expect(result.isOnSale).toBe(true);
        expect(result.discountPercent).toBe(50);
    });

    it('rounds 159.9 vs 199.9 to 20%', () => {
        expect(withDiscount({ price: 159.9, originalPrice: 199.9 }).discountPercent).toBe(20);
    });

    it('is not on sale without an originalPrice', () => {
        const result = withDiscount({ price: 149.9, originalPrice: null });
        expect(result.isOnSale).toBe(false);
        expect(result.discountPercent).toBeNull();
    });

    it('is not on sale when originalPrice is not above price', () => {
        const result = withDiscount({ price: 100, originalPrice: 100 });
        expect(result.isOnSale).toBe(false);
        expect(result.discountPercent).toBeNull();
    });

    it('keeps the remaining fields untouched', () => {
        expect(withDiscount({ id: 'p1', name: 'X', price: 10 }).name).toBe('X');
    });
});
