import type { Cart } from './cart';
import { formatBRL } from './format';
import type { CartIssue } from './reconcile';

export type OrderRequest = {
    items: { productId: string; quantity: number; unitPrice: number }[];
    couponCode: string | null;
};

export type OrderOutcome =
    | { kind: 'redirect'; url: string }
    | { kind: 'outdated'; issues: CartIssue[] }
    | { kind: 'invalid-coupon' }
    | { kind: 'unauthorized' }
    | { kind: 'error' };

export const CHECKOUT_ERROR = 'Não foi possível iniciar o pagamento agora. Tente novamente.';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

export function buildOrderRequest(cart: Cart): OrderRequest {
    return {
        items: cart.items.map(({ productId, quantity, price }) => ({ productId, quantity, unitPrice: price })),
        couponCode: cart.couponCode,
    };
}

export function interpretOrderResponse(response: { ok: boolean; status: number }, body: unknown): OrderOutcome {
    if (response.ok) {
        const url = isRecord(body) ? body.payment_url : undefined;
        return typeof url === 'string' && url.startsWith('https://') ? { kind: 'redirect', url } : { kind: 'error' };
    }
    if (response.status === 409 && isRecord(body) && body.code === 'CART_OUTDATED' && Array.isArray(body.items)) {
        return { kind: 'outdated', issues: body.items as CartIssue[] };
    }
    if (response.status === 400) return { kind: 'invalid-coupon' };
    if (response.status === 401) return { kind: 'unauthorized' };
    return { kind: 'error' };
}

export function describeIssues(cart: Cart, issues: CartIssue[]): string[] {
    const names = new Map(cart.items.map((item) => [item.productId, item.name]));

    return issues.map((issue) => {
        const name = names.get(issue.productId);
        if (issue.reason === 'PRICE_CHANGED') {
            const label = name ?? 'um item';
            return typeof issue.price === 'number'
                ? `Preço de ${label} mudou para ${formatBRL(issue.price)}`
                : `O preço de ${label} mudou`;
        }
        if (issue.reason === 'OUT_OF_STOCK' && name) return `${name} saiu de estoque`;
        return 'Um item do carrinho não está mais disponível';
    });
}
