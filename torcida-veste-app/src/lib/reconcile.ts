import type { Cart } from './cart';

export type CartIssue = {
    productId: string;
    reason: 'NOT_FOUND' | 'OUT_OF_STOCK' | 'PRICE_CHANGED';
    price?: number;
    originalPrice?: number | null;
};

export function reconcileCart(cart: Cart, issues: CartIssue[]): Cart {
    const byProduct = new Map(issues.map((issue) => [issue.productId, issue]));

    return {
        ...cart,
        items: cart.items.flatMap((item) => {
            const issue = byProduct.get(item.productId);
            if (!issue) return [item];
            if (issue.reason !== 'PRICE_CHANGED') return [];
            return [
                {
                    ...item,
                    price: issue.price ?? item.price,
                    originalPrice: issue.originalPrice !== undefined ? issue.originalPrice : item.originalPrice,
                },
            ];
        }),
    };
}
