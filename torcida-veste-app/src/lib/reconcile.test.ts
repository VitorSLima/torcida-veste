import { describe, expect, it } from 'vitest';
import { addItem } from './cart';
import { reconcileCart } from './reconcile';

const shirt = { productId: 'p1', name: 'Camiseta', price: 69.9, originalPrice: 139.9, image: null };
const set = { productId: 'p2', name: 'Conjunto', price: 159.9, originalPrice: 199.9, image: null };
const base = addItem(addItem({ items: [], couponCode: 'X' }, shirt, 2), set, 1);

describe('reconcileCart', () => {
    it('removes products that are gone or out of stock', () => {
        const next = reconcileCart(base, [
            { productId: 'p1', reason: 'NOT_FOUND' },
            { productId: 'p2', reason: 'OUT_OF_STOCK' },
        ]);
        expect(next.items).toEqual([]);
    });
    it('updates price and original price, keeping quantity', () => {
        const next = reconcileCart(base, [{ productId: 'p1', reason: 'PRICE_CHANGED', price: 59.9, originalPrice: null }]);
        expect(next.items[0]).toMatchObject({ productId: 'p1', price: 59.9, originalPrice: null, quantity: 2 });
        expect(next.items[1].productId).toBe('p2');
    });
    it('keeps the coupon and ignores issues for unknown products', () => {
        const next = reconcileCart(base, [{ productId: 'zzz', reason: 'NOT_FOUND' }]);
        expect(next).toEqual(base);
    });
});
