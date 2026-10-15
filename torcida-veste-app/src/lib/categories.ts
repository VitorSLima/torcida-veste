import type { Category } from './types';

const ORDER = ['primeira linha', 'tailandesa', 'conjuntos', 'pro socks'];

const IMAGES: Record<string, string> = {
    'primeira linha': '/products/bayern-shirt.png',
    tailandesa: '/products/bayern-shirt.png',
    conjuntos: '/products/conjunto.png',
    'pro socks': '/products/pro-socks.png',
};

const rank = (name: string) => {
    const index = ORDER.indexOf(name.toLowerCase());
    return index === -1 ? ORDER.length : index;
};

export function sortCategories(categories: Category[]): Category[] {
    return [...categories].sort(
        (a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name),
    );
}

export function findCategory(
    categories: Category[],
    name: string,
): Category | undefined {
    return categories.find((c) => c.name.toLowerCase() === name.toLowerCase());
}

export function categoryImage(name: string): string {
    return IMAGES[name.toLowerCase()] ?? '/products/bayern-shirt.png';
}
