import { describe, expect, it } from 'vitest';
import { buildOrderRequest, describeIssues, interpretOrderResponse } from './checkout';
import type { Cart } from './cart';

const cart: Cart = {
    couponCode: 'TORCIDA10',
    items: [
        { productId: 'a', name: 'Camiseta', price: 69.9, originalPrice: 99.9, image: null, quantity: 2 },
        { productId: 'b', name: 'Conjunto', price: 159.9, originalPrice: null, image: null, quantity: 1 },
    ],
};

describe('buildOrderRequest', () => {
    it('maps cart items to the order body using price as unitPrice', () => {
        expect(buildOrderRequest(cart)).toEqual({
            items: [
                { productId: 'a', quantity: 2, unitPrice: 69.9 },
                { productId: 'b', quantity: 1, unitPrice: 159.9 },
            ],
            couponCode: 'TORCIDA10',
        });
    });

    it('sends a null coupon when there is none', () => {
        expect(buildOrderRequest({ ...cart, couponCode: null }).couponCode).toBeNull();
    });
});

describe('interpretOrderResponse', () => {
    it('redirects on success', () => {
        expect(
            interpretOrderResponse({ ok: true, status: 201 }, { orderId: 'o1', payment_url: 'https://checkout.stripe.com/x' }),
        ).toEqual({ kind: 'redirect', url: 'https://checkout.stripe.com/x' });
    });

    it('treats a success without a valid payment url as an error', () => {
        expect(interpretOrderResponse({ ok: true, status: 201 }, { orderId: 'o1' })).toEqual({ kind: 'error' });
        expect(interpretOrderResponse({ ok: true, status: 201 }, null)).toEqual({ kind: 'error' });
        expect(interpretOrderResponse({ ok: true, status: 201 }, { payment_url: 'javascript:alert(1)' })).toEqual({ kind: 'error' });
    });

    it('reads the outdated cart issues on 409', () => {
        const issues = [{ productId: 'a', reason: 'PRICE_CHANGED', price: 59.9 }];
        expect(interpretOrderResponse({ ok: false, status: 409 }, { code: 'CART_OUTDATED', items: issues })).toEqual({
            kind: 'outdated',
            issues,
        });
    });

    it('treats other 409 bodies as errors', () => {
        expect(interpretOrderResponse({ ok: false, status: 409 }, { code: 'OTHER' })).toEqual({ kind: 'error' });
    });

    it('maps 400 to invalid coupon and 401 to unauthorized', () => {
        expect(interpretOrderResponse({ ok: false, status: 400 }, null)).toEqual({ kind: 'invalid-coupon' });
        expect(interpretOrderResponse({ ok: false, status: 401 }, null)).toEqual({ kind: 'unauthorized' });
    });

    it('maps gateway failures to error', () => {
        expect(interpretOrderResponse({ ok: false, status: 503 }, null)).toEqual({ kind: 'error' });
        expect(interpretOrderResponse({ ok: false, status: 502 }, {})).toEqual({ kind: 'error' });
    });
});

describe('describeIssues', () => {
    it('describes price changes, stock and missing products by cart name', () => {
        expect(
            describeIssues(cart, [
                { productId: 'a', reason: 'PRICE_CHANGED', price: 59.9 },
                { productId: 'b', reason: 'OUT_OF_STOCK' },
                { productId: 'z', reason: 'NOT_FOUND' },
            ]),
        ).toEqual([
            expect.stringMatching(/^Preço de Camiseta mudou para R\$\s59,90$/),
            'Conjunto saiu de estoque',
            'Um item do carrinho não está mais disponível',
        ]);
    });

    it('falls back to a generic text for a price change without a price', () => {
        expect(describeIssues(cart, [{ productId: 'a', reason: 'PRICE_CHANGED' }])).toEqual(['O preço de Camiseta mudou']);
    });
});
