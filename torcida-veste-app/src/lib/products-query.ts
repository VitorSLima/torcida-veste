export type ProductsQuery = {
    page?: number;
    limit?: number;
    search?: string;
    onSale?: boolean;
    categoryId?: string;
    leagueId?: string;
};

export function buildProductsQuery(query: ProductsQuery): string {
    const params = new URLSearchParams();

    if (query.page && query.page > 1) params.set('page', String(query.page));
    if (query.limit) params.set('limit', String(query.limit));
    if (query.search?.trim()) params.set('search', query.search.trim());
    if (query.onSale) params.set('onSale', 'true');
    if (query.categoryId) params.set('categoryId', query.categoryId);
    if (query.leagueId) params.set('leagueId', query.leagueId);

    const serialized = params.toString();
    return serialized ? `?${serialized}` : '';
}

export function parsePage(value: string | string[] | undefined): number {
    const parsed = Number(Array.isArray(value) ? value[0] : value);
    return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
}

export function pageHref(
    basePath: string,
    params: Record<string, string | undefined>,
    page: number,
): string {
    const search = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
        if (value) search.set(key, value);
    }
    if (page > 1) search.set('page', String(page));

    const serialized = search.toString();
    return serialized ? `${basePath}?${serialized}` : basePath;
}
