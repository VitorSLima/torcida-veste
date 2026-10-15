import { buildProductsQuery, type ProductsQuery } from './products-query';
import type { Category, Product, ProductListResponse } from './types';

export class ApiError extends Error {
    constructor(
        public readonly status: number,
        message: string,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

const baseUrl = () => process.env.API_URL ?? 'http://localhost:3000';

async function request<T>(path: string, revalidate = 60): Promise<T> {
    const response = await fetch(`${baseUrl()}${path}`, {
        next: { revalidate },
    });

    if (!response.ok) {
        throw new ApiError(response.status, `API ${response.status} on ${path}`);
    }

    return response.json() as Promise<T>;
}

export function getProducts(query: ProductsQuery = {}) {
    return request<ProductListResponse>(`/product${buildProductsQuery(query)}`);
}

export async function getProduct(id: string): Promise<Product | null> {
    try {
        const { product } = await request<{ product: Product }>(
            `/product/${encodeURIComponent(id)}`,
        );
        return product;
    } catch (error) {
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
    }
}

export function getCategories() {
    return request<Category[]>('/category', 300);
}
