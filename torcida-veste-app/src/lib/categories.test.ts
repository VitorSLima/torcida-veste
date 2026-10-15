import { describe, expect, it } from 'vitest';
import { categoryImage, findCategory, sortCategories } from './categories';

const cats = [
    { id: '3', name: 'Pro Socks' },
    { id: '1', name: 'Primeira Linha' },
    { id: '9', name: 'Outra Coisa' },
    { id: '2', name: 'Conjuntos' },
    { id: '4', name: 'Tailandesa' },
];

describe('sortCategories', () => {
    it('orders by the storefront order, unknown ones last', () => {
        expect(sortCategories(cats).map((c) => c.name)).toEqual([
            'Primeira Linha',
            'Tailandesa',
            'Conjuntos',
            'Pro Socks',
            'Outra Coisa',
        ]);
    });
    it('does not mutate the input', () => {
        const copy = [...cats];
        sortCategories(cats);
        expect(cats).toEqual(copy);
    });
});

describe('findCategory', () => {
    it('matches by name ignoring case', () => {
        expect(findCategory(cats, 'conjuntos')?.id).toBe('2');
    });
    it('returns undefined when missing', () => {
        expect(findCategory(cats, 'nope')).toBeUndefined();
    });
});

describe('categoryImage', () => {
    it('maps known categories to product art', () => {
        expect(categoryImage('Conjuntos')).toBe('/products/conjunto.png');
        expect(categoryImage('Pro Socks')).toBe('/products/pro-socks.png');
    });
    it('falls back to the shirt', () => {
        expect(categoryImage('Qualquer')).toBe('/products/bayern-shirt.png');
    });
});
