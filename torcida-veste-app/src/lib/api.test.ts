import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, getCategories, getProduct, getProducts } from './api';

const fetchMock = vi.fn();

function respond(status: number, body: unknown) {
    fetchMock.mockResolvedValueOnce({
        ok: status >= 200 && status < 300,
        status,
        json: async () => body,
    });
}

beforeEach(() => {
    process.env.API_URL = 'http://api.test';
    vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllGlobals();
});

describe('getProducts', () => {
    it('builds the URL from the query and asks Next to revalidate', async () => {
        respond(200, { products: [], info: { page: 1, limit: 5, total: 0, totalPages: 0 } });

        await getProducts({ onSale: true, limit: 5 });

        expect(fetchMock).toHaveBeenCalledWith(
            'http://api.test/product?limit=5&onSale=true',
            { next: { revalidate: 60 } },
        );
    });

    it('throws ApiError on a non-2xx response', async () => {
        respond(500, {});
        await expect(getProducts()).rejects.toMatchObject({ status: 500 });
    });
});

describe('getProduct', () => {
    it('unwraps { product }', async () => {
        respond(200, { product: { id: 'p1', name: 'X' } });
        await expect(getProduct('p1')).resolves.toMatchObject({ id: 'p1' });
        expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/product/p1');
    });

    it('returns null on 404', async () => {
        respond(404, {});
        await expect(getProduct('nope')).resolves.toBeNull();
    });

    it('rethrows other errors', async () => {
        respond(503, {});
        await expect(getProduct('p1')).rejects.toBeInstanceOf(ApiError);
    });

    it('encodes the id', async () => {
        respond(404, {});
        await getProduct('a/b');
        expect(fetchMock.mock.calls[0][0]).toBe('http://api.test/product/a%2Fb');
    });
});

describe('getCategories', () => {
    it('returns the list with a longer revalidate window', async () => {
        respond(200, [{ id: '1', name: 'Conjuntos' }]);
        await expect(getCategories()).resolves.toEqual([{ id: '1', name: 'Conjuntos' }]);
        expect(fetchMock).toHaveBeenCalledWith('http://api.test/category', {
            next: { revalidate: 300 },
        });
    });
});
