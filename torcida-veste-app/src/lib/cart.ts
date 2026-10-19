import { clampQuantity } from './quantity';
import { shippingFor } from './shipping';

export const CART_STORAGE_KEY = 'tv_cart_v1';

export type CartItem = {
    productId: string;
    name: string;
    price: number;
    originalPrice: number | null;
    image: string | null;
    quantity: number;
};
export type Cart = { items: CartItem[]; couponCode: string | null };
export type CartProduct = Omit<CartItem, 'quantity'>;

const MAX_COUPON_LENGTH = 40;
const money = (value: number) => Math.round(value * 100) / 100;

const normalizeCoupon = (value: unknown): string | null => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed && trimmed.length <= MAX_COUPON_LENGTH ? trimmed : null;
};

export const clearCart = (): Cart => ({ items: [], couponCode: null });

export function setCoupon(cart: Cart, code: string | null): Cart {
    const trimmed = code?.trim().slice(0, MAX_COUPON_LENGTH) ?? '';
    return { ...cart, couponCode: trimmed || null };
}

export function addItem(cart: Cart, product: CartProduct, quantity = 1): Cart {
    const existing = cart.items.find((item) => item.productId === product.productId);

    if (!existing) {
        return { ...cart, items: [...cart.items, { ...product, quantity: clampQuantity(quantity) }] };
    }

    return {
        ...cart,
        items: cart.items.map((item) =>
            item.productId === product.productId
                ? { ...item, quantity: clampQuantity(item.quantity + quantity) }
                : item,
        ),
    };
}

export function setQuantity(cart: Cart, productId: string, quantity: number): Cart {
    if (quantity <= 0) return removeItem(cart, productId);

    return {
        ...cart,
        items: cart.items.map((item) =>
            item.productId === productId ? { ...item, quantity: clampQuantity(quantity) } : item,
        ),
    };
}

export function removeItem(cart: Cart, productId: string): Cart {
    return { ...cart, items: cart.items.filter((item) => item.productId !== productId) };
}

export function cartCount(cart: Cart): number {
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartTotals(cart: Cart, couponDiscount = 0) {
    let subtotal = 0;
    let payable = 0;

    for (const item of cart.items) {
        const list = item.originalPrice != null && item.originalPrice > item.price ? item.originalPrice : item.price;
        subtotal += list * item.quantity;
        payable += item.price * item.quantity;
    }

    const goods = money(payable);
    const coupon = Math.min(money(Math.max(couponDiscount, 0)), goods);
    const savings = money(subtotal - payable);
    const shipping = shippingFor(money(goods - coupon));

    return {
        subtotal: money(subtotal),
        savings,
        couponDiscount: coupon,
        discounts: money(savings + coupon),
        shipping,
        total: money(goods - coupon + shipping),
        itemCount: cartCount(cart),
    };
}

export const serializeCart = (cart: Cart) => JSON.stringify(cart);

const isValidItem = (item: unknown): item is CartItem => {
    const value = item as Partial<CartItem> | null;
    return (
        !!value &&
        typeof value.productId === 'string' &&
        typeof value.name === 'string' &&
        typeof value.price === 'number' &&
        Number.isFinite(value.price) &&
        typeof value.quantity === 'number'
    );
};

export function parseCart(raw: string | null): Cart {
    if (!raw) return clearCart();

    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed?.items)) return clearCart();

        return {
            couponCode: normalizeCoupon(parsed.couponCode),
            items: parsed.items.filter(isValidItem).flatMap((item: CartItem) => {
                if (item.quantity <= 0) return [];
                return [
                    {
                        productId: item.productId,
                        name: item.name,
                        price: item.price,
                        originalPrice: typeof item.originalPrice === 'number' ? item.originalPrice : null,
                        image: typeof item.image === 'string' ? item.image : null,
                        quantity: clampQuantity(item.quantity),
                    },
                ];
            }),
        };
    } catch {
        return clearCart();
    }
}
