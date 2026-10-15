import { describe, expect, it } from 'vitest';
import { clampQuantity, MAX_QUANTITY } from './quantity';

describe('clampQuantity', () => {
    it('keeps values inside the range', () => {
        expect(clampQuantity(3)).toBe(3);
    });
    it('never goes below 1', () => {
        expect(clampQuantity(0)).toBe(1);
        expect(clampQuantity(-4)).toBe(1);
    });
    it('never goes above the maximum', () => {
        expect(clampQuantity(MAX_QUANTITY + 5)).toBe(MAX_QUANTITY);
    });
    it('falls back to 1 for non-numeric input', () => {
        expect(clampQuantity(Number.NaN)).toBe(1);
    });
});
