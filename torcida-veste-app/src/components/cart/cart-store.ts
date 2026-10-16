import { CART_STORAGE_KEY, parseCart, serializeCart, type Cart } from '@/lib/cart';

export const EMPTY_CART: Cart = { items: [] };

const listeners = new Set<() => void>();
let cache: { raw: string | null; cart: Cart } = { raw: null, cart: EMPTY_CART };

function readRaw(): string | null {
    try {
        return window.localStorage.getItem(CART_STORAGE_KEY);
    } catch {
        return null;
    }
}

export function getSnapshot(): Cart {
    const raw = readRaw();
    if (raw !== cache.raw) cache = { raw, cart: raw ? parseCart(raw) : EMPTY_CART };
    return cache.cart;
}

export const getServerSnapshot = () => EMPTY_CART;

export function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
        if (event.key === CART_STORAGE_KEY || event.key === null) listener();
    };
    window.addEventListener('storage', onStorage);
    return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', onStorage);
    };
}

export function updateCart(update: (cart: Cart) => Cart) {
    const next = update(getSnapshot());
    try {
        window.localStorage.setItem(CART_STORAGE_KEY, serializeCart(next));
    } catch {
        // storage indisponível: o carrinho vale só nesta sessão da aba
        cache = { raw: serializeCart(next), cart: next };
    }
    listeners.forEach((listener) => listener());
}
