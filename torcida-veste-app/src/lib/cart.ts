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
export type Cart = { items: CartItem[] };
export type CartProduct = Omit<CartItem, 'quantity'>;

const money = (value: number) => Math.round(value * 100) / 100;

export function addItem(cart: Cart, product: CartProduct, quantity = 1): Cart {
    const existing = cart.items.find((item) => item.productId === product.productId);

    if (!existing) {
        return { items: [...cart.items, { ...product, quantity: clampQuantity(quantity) }] };
    }

    return {
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
        items: cart.items.map((item) =>
            item.productId === productId ? { ...item, quantity: clampQuantity(quantity) } : item,
        ),
    };
}

export function removeItem(cart: Cart, productId: string): Cart {
    return { items: cart.items.filter((item) => item.productId !== productId) };
}

export function cartCount(cart: Cart): number {
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
}

export function cartTotals(cart: Cart) {
    let subtotal = 0;
    let payable = 0;

    for (const item of cart.items) {
        const list = item.originalPrice != null && item.originalPrice > item.price ? item.originalPrice : item.price;
        subtotal += list * item.quantity;
        payable += item.price * item.quantity;
    }

    const shipping = shippingFor(money(payable));

    return {
        subtotal: money(subtotal),
        savings: money(subtotal - payable),
        shipping,
        total: money(payable + shipping),
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
    if (!raw) return { items: [] };

    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed?.items)) return { items: [] };

        return {
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
        return { items: [] };
    }
}
