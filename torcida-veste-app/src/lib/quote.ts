import type { Cart } from './cart';
import type { CartIssue } from './reconcile';

export type QuoteOutcome =
    | { kind: 'ok'; couponDiscount: number }
    | { kind: 'invalid-coupon' }
    | { kind: 'outdated'; issues: CartIssue[] }
    | { kind: 'error' };

export function quoteKey(cart: Cart): string {
    if (!cart.couponCode) return '';
    const items = cart.items.map((item) => `${item.productId}:${item.quantity}`).join(',');
    return `${cart.couponCode.trim().toUpperCase()}|${items}`;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

export function interpretQuote(response: { ok: boolean; status: number }, body: unknown): QuoteOutcome {
    if (response.ok) {
        const discount = isRecord(body) ? body.couponDiscount : undefined;
        return typeof discount === 'number' && Number.isFinite(discount)
            ? { kind: 'ok', couponDiscount: discount }
            : { kind: 'error' };
    }
    if (response.status === 400) return { kind: 'invalid-coupon' };
    if (response.status === 409 && isRecord(body) && body.code === 'CART_OUTDATED' && Array.isArray(body.items)) {
        return { kind: 'outdated', issues: body.items as CartIssue[] };
    }
    return { kind: 'error' };
}

export async function fetchCouponQuote(cart: Cart, signal: AbortSignal): Promise<QuoteOutcome> {
    const response = await fetch('/api/quote', {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            items: cart.items.map(({ productId, quantity }) => ({ productId, quantity })),
            couponCode: cart.couponCode,
        }),
    });
    const body: unknown = await response.json().catch(() => null);
    return interpretQuote(response, body);
}
