import { ConflictException } from '@nestjs/common';

export type CartIssue = {
    productId: string;
    reason: 'NOT_FOUND' | 'OUT_OF_STOCK' | 'PRICE_CHANGED';
    price?: number;
    originalPrice?: number | null;
};

export class CartOutdatedException extends ConflictException {
    constructor(public readonly items: CartIssue[]) {
        super({ statusCode: 409, code: 'CART_OUTDATED', message: 'Cart is out of date', items });
    }
}
