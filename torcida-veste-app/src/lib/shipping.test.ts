import { describe, expect, it } from 'vitest';
import { FREE_SHIPPING_FROM, SHIPPING_FLAT, shippingFor } from './shipping';

describe('shippingFor', () => {
    it('is free for an empty cart', () => expect(shippingFor(0)).toBe(0));
    it('charges the flat rate below the threshold', () => expect(shippingFor(244.8)).toBe(SHIPPING_FLAT));
    it('is free at and above the threshold', () => {
        expect(shippingFor(FREE_SHIPPING_FROM)).toBe(0);
        expect(shippingFor(FREE_SHIPPING_FROM + 1)).toBe(0);
    });
});
