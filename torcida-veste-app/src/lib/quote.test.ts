import { describe, expect, it } from 'vitest';
import type { Cart } from './cart';
import { interpretQuote, quoteKey } from './quote';

const item = (productId: string, quantity: number) => ({
    productId, name: productId, price: 10, originalPrice: null, image: null, quantity,
});

describe('quoteKey', () => {
    it('is empty without coupon', () => {
        expect(quoteKey({ items: [item('a', 1)], couponCode: null })).toBe('');
    });
    it('combines normalized code with product quantities', () => {
        const cart: Cart = { items: [item('a', 1), item('b', 2)], couponCode: ' torcida10 ' };
        expect(quoteKey(cart)).toBe('TORCIDA10|a:1,b:2');
    });
    it('changes when quantity changes', () => {
        const a = quoteKey({ items: [item('a', 1)], couponCode: 'X' });
        const b = quoteKey({ items: [item('a', 2)], couponCode: 'X' });
        expect(a).not.toBe(b);
    });
});

describe('interpretQuote', () => {
    it('treats 201 as ok', () => {
        expect(interpretQuote({ ok: true, status: 201 }, { couponDiscount: 22.98 })).toEqual({ kind: 'ok', couponDiscount: 22.98 });
    });
    it('errors on malformed success body', () => {
        expect(interpretQuote({ ok: true, status: 201 }, {})).toEqual({ kind: 'error' });
    });
    it('maps 400 to invalid coupon', () => {
        expect(interpretQuote({ ok: false, status: 400 }, { message: 'x' })).toEqual({ kind: 'invalid-coupon' });
    });
    it('maps 409 CART_OUTDATED to issues', () => {
        const issues = [{ productId: 'a', reason: 'OUT_OF_STOCK' }];
        expect(interpretQuote({ ok: false, status: 409 }, { code: 'CART_OUTDATED', items: issues })).toEqual({ kind: 'outdated', issues });
    });
    it('maps other failures to error', () => {
        expect(interpretQuote({ ok: false, status: 502 }, null)).toEqual({ kind: 'error' });
        expect(interpretQuote({ ok: false, status: 409 }, { code: 'OTHER' })).toEqual({ kind: 'error' });
    });
});
