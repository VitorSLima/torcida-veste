import { describe, expect, it } from 'vitest';
import { buildProductsQuery, pageHref, parsePage } from './products-query';

describe('buildProductsQuery', () => {
    it('returns an empty string when nothing is set', () => {
        expect(buildProductsQuery({})).toBe('');
    });
    it('includes only meaningful params, in a stable order', () => {
        expect(
            buildProductsQuery({ onSale: true, limit: 5, categoryId: 'c1' }),
        ).toBe('?limit=5&onSale=true&categoryId=c1');
    });
    it('omits page 1 and false/blank values', () => {
        expect(buildProductsQuery({ page: 1, onSale: false, search: '  ' })).toBe('');
    });
    it('keeps page > 1 and trims search', () => {
        expect(buildProductsQuery({ page: 3, search: ' camiseta ' })).toBe(
            '?page=3&search=camiseta',
        );
    });
});

describe('parsePage', () => {
    it('parses valid values', () => {
        expect(parsePage('4')).toBe(4);
        expect(parsePage(['2', '9'])).toBe(2);
    });
    it('falls back to 1 for invalid values', () => {
        expect(parsePage(undefined)).toBe(1);
        expect(parsePage('0')).toBe(1);
        expect(parsePage('abc')).toBe(1);
        expect(parsePage('1.5')).toBe(1);
    });
});

describe('pageHref', () => {
    it('omits page for the first page', () => {
        expect(pageHref('/ofertas', {}, 1)).toBe('/ofertas');
    });
    it('keeps extra params and sets the page', () => {
        expect(pageHref('/buscar', { q: 'bayern' }, 2)).toBe('/buscar?q=bayern&page=2');
    });
    it('drops undefined params', () => {
        expect(pageHref('/buscar', { q: undefined }, 3)).toBe('/buscar?page=3');
    });
});
