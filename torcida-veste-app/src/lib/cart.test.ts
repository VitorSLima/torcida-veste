import { describe, expect, it } from 'vitest';
import { addItem, cartCount, cartTotals, parseCart, removeItem, serializeCart, setQuantity, type Cart } from './cart';
import { MAX_QUANTITY } from './quantity';

const shirt = { productId: 'p1', name: 'Camiseta', price: 69.9, originalPrice: 139.9, image: '/a.png' };
const set = { productId: 'p2', name: 'Conjunto', price: 169.9, originalPrice: 199.9, image: null };
const empty: Cart = { items: [] };

describe('addItem', () => {
    it('adds a new line', () => {
        expect(addItem(empty, shirt, 2).items).toEqual([{ ...shirt, quantity: 2 }]);
    });
    it('clamps the quantity of a new line', () => {
        expect(addItem(empty, shirt, 99).items[0].quantity).toBe(MAX_QUANTITY);
        expect(addItem(empty, shirt, 0).items[0].quantity).toBe(1);
    });
    it('merges quantities for the same product', () => {
        const cart = addItem(addItem(empty, shirt, 1), shirt, 2);
        expect(cart.items).toHaveLength(1);
        expect(cart.items[0].quantity).toBe(3);
    });
    it('caps the quantity', () => {
        expect(addItem(addItem(empty, shirt, MAX_QUANTITY), shirt, 5).items[0].quantity).toBe(MAX_QUANTITY);
    });
    it('does not mutate the original cart', () => {
        const cart = addItem(empty, shirt);
        addItem(cart, set);
        expect(cart.items).toHaveLength(1);
    });
});

describe('setQuantity / removeItem', () => {
    const cart = addItem(addItem(empty, shirt, 1), set, 1);
    it('updates and clamps', () => {
        expect(setQuantity(cart, 'p1', 4).items[0].quantity).toBe(4);
        expect(setQuantity(cart, 'p1', 99).items[0].quantity).toBe(MAX_QUANTITY);
    });
    it('removes the line when quantity is 0 or less', () => {
        expect(setQuantity(cart, 'p1', 0).items.map((i) => i.productId)).toEqual(['p2']);
    });
    it('removeItem drops only that product', () => {
        expect(removeItem(cart, 'p2').items.map((i) => i.productId)).toEqual(['p1']);
    });
});

describe('cartCount', () => {
    it('sums quantities', () => {
        expect(cartCount(addItem(addItem(empty, shirt, 2), set, 3))).toBe(5);
    });
});

describe('cartTotals', () => {
    it('matches the mockup: 339,80 − 100,00 + 5,00 = 244,80', () => {
        const cart = addItem(addItem(empty, shirt, 1), set, 1);
        expect(cartTotals(cart)).toEqual({ subtotal: 339.8, savings: 100, shipping: 5, total: 244.8, itemCount: 2 });
    });
    it('treats items without originalPrice as no discount', () => {
        const cart = addItem(empty, { ...shirt, originalPrice: null }, 2);
        expect(cartTotals(cart)).toMatchObject({ subtotal: 139.8, savings: 0 });
    });
    it('has free shipping and zero total for an empty cart', () => {
        expect(cartTotals(empty)).toEqual({ subtotal: 0, savings: 0, shipping: 0, total: 0, itemCount: 0 });
    });
    it('gives free shipping when the payable amount reaches the threshold', () => {
        const cart = addItem(empty, { ...shirt, price: 150, originalPrice: null }, 2);
        expect(cartTotals(cart)).toMatchObject({ shipping: 0, total: 300 });
    });
    it('rounds savings and total to cents', () => {
        const withDiscount = addItem(empty, shirt, 3);
        expect(cartTotals(withDiscount).savings).toBe(210);
        const noDiscount = addItem(empty, { ...shirt, price: 69.9, originalPrice: null }, 3);
        expect(cartTotals(noDiscount).total).toBe(214.7);
    });
    it('rounds the payable amount before applying the free shipping threshold', () => {
        // 0.03 + 3 * 99.99 = 299.99999999999994 in floating point, but exactly R$ 300,00
        const cart = addItem(
            addItem(empty, { ...shirt, productId: 'a', price: 0.03, originalPrice: null }, 1),
            { ...shirt, productId: 'b', price: 99.99, originalPrice: null },
            3,
        );
        expect(cartTotals(cart)).toMatchObject({ shipping: 0, total: 300 });
    });
    it('uses the payable amount, not the list price, for the free shipping threshold', () => {
        const cart = addItem(empty, { ...shirt, price: 149, originalPrice: 200 }, 2);
        expect(cartTotals(cart)).toMatchObject({ subtotal: 400, savings: 102, shipping: 5, total: 303 });
    });
    it('avoids floating point noise', () => {
        const cart = addItem(empty, { ...shirt, price: 0.1, originalPrice: null }, 3);
        expect(cartTotals(cart).subtotal).toBe(0.3);
    });
});

describe('parseCart / serializeCart', () => {
    it('round-trips', () => {
        const cart = addItem(empty, shirt, 2);
        expect(parseCart(serializeCart(cart))).toEqual(cart);
    });
    it('returns an empty cart for null, invalid JSON or wrong shape', () => {
        expect(parseCart(null)).toEqual(empty);
        expect(parseCart('{oops')).toEqual(empty);
        expect(parseCart('{"items":"x"}')).toEqual(empty);
    });
    it('drops invalid lines and clamps quantities', () => {
        const raw = JSON.stringify({
            items: [
                { ...shirt, quantity: 99 },
                { productId: 'p9', name: 'sem preço', quantity: 1 },
                { ...set, quantity: -3 },
            ],
        });
        expect(parseCart(raw).items).toEqual([{ ...shirt, quantity: MAX_QUANTITY }]);
    });
    it('drops lines with quantity zero or missing identifying fields', () => {
        const raw = JSON.stringify({
            items: [
                { ...shirt, quantity: 0 },
                { ...shirt, productId: 7, quantity: 1 },
                { ...shirt, name: null, quantity: 1 },
                { ...shirt, price: 'x', quantity: 1 },
                { ...shirt, quantity: '2' },
                { ...shirt, productId: 'ok', quantity: 2 },
            ],
        });
        expect(parseCart(raw).items.map((i) => i.productId)).toEqual(['ok']);
    });
    it('normalizes invalid optional fields to null', () => {
        const raw = JSON.stringify({ items: [{ ...shirt, originalPrice: 'x', image: 5, quantity: 1 }] });
        expect(parseCart(raw).items[0]).toMatchObject({ originalPrice: null, image: null });
    });
    it('returns an empty cart for non-object payloads', () => {
        expect(parseCart('null')).toEqual(empty);
        expect(parseCart('{"items":{}}')).toEqual(empty);
    });
});
