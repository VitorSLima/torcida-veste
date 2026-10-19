export type ProductImage = { id: string; url: string; is_Cover: boolean };

export type Product = {
    id: string;
    name: string;
    size: string;
    description: string;
    price: number;
    originalPrice: number | null;
    stock_status: 'IN_STOCK' | 'OUT_OF_STOCK';
    Category: { id: string; name: string };
    League: { id: string; name: string };
    Images: ProductImage[];
    isOnSale: boolean;
    discountPercent: number | null;
};

export type ListInfo = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

export type ProductListResponse = { products: Product[]; info: ListInfo };

export type Category = { id: string; name: string };
