import { STOCK_STATUS } from '@prisma/client';

export interface CreateProductInput {
    name: string;
    size: string;
    description?: string | null;
    price: number;
    pricePromo?: number;
    stock_status: STOCK_STATUS;
    category_id: string;
    league_id: string;
}
