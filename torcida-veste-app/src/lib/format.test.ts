import { describe, expect, it } from 'vitest';
import { formatBRL } from './format';

const plain = (s: string) => s.replace(/ /g, ' ');

describe('formatBRL', () => {
    it('formats with comma decimals', () => {
        expect(plain(formatBRL(69.9))).toBe('R$ 69,90');
    });
    it('uses dot thousands separators', () => {
        expect(plain(formatBRL(1234.5))).toBe('R$ 1.234,50');
    });
    it('formats zero', () => {
        expect(plain(formatBRL(0))).toBe('R$ 0,00');
    });
});
