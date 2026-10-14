import { STOCK_STATUS } from '@prisma/client';

export interface UpdateProductInput {
    name?: string | null;
    size?: string | null;
    description?: string | null;
    price?: number | null;
    originalPrice?: number | null;
    stock_status?: STOCK_STATUS | null;
    category_id?: string | null;
    league_id?: string | null;
}
