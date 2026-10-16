'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import {
    addItem,
    cartTotals,
    clearCart,
    removeItem,
    setCoupon,
    setQuantity,
    type Cart,
    type CartProduct,
} from '@/lib/cart';
import { fetchCouponQuote, quoteKey } from '@/lib/quote';
import { reconcileCart } from '@/lib/reconcile';
import { getServerSnapshot, getSnapshot, subscribe, updateCart } from './cart-store';

type CartState = {
    cart: Cart;
    totals: ReturnType<typeof cartTotals>;
    open: boolean;
    setOpen: (open: boolean) => void;
    add: (product: CartProduct, quantity: number) => void;
    setQty: (productId: string, quantity: number) => void;
    remove: (productId: string) => void;
    couponCode: string | null;
    couponDiscount: number;
    couponError: string | null;
    applyCoupon: (code: string) => void;
    removeCoupon: () => void;
    clear: () => void;
};

type QuoteResult = { key: string; couponDiscount: number } | { key: string; error: string };

const QUOTE_DEBOUNCE_MS = 300;
const INVALID_COUPON = 'Cupom inválido ou expirado';
const QUOTE_UNAVAILABLE = 'Não foi possível validar o cupom agora.';

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const cart = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    const [open, setOpen] = useState(false);
    const [quote, setQuote] = useState<QuoteResult | null>(null);
    const [invalidCoupon, setInvalidCoupon] = useState(false);

    const add = useCallback((product: CartProduct, quantity: number) => {
        updateCart((current) => addItem(current, product, quantity));
        setOpen(true);
    }, []);
    const setQty = useCallback((id: string, quantity: number) => updateCart((c) => setQuantity(c, id, quantity)), []);
    const remove = useCallback((id: string) => updateCart((c) => removeItem(c, id)), []);
    const applyCoupon = useCallback((code: string) => {
        setInvalidCoupon(false);
        updateCart((c) => setCoupon(c, code));
    }, []);
    const removeCoupon = useCallback(() => {
        setInvalidCoupon(false);
        updateCart((c) => setCoupon(c, null));
    }, []);
    const clear = useCallback(() => {
        setInvalidCoupon(false);
        updateCart(() => clearCart());
    }, []);

    const key = useMemo(() => quoteKey(cart), [cart]);
    const hasItems = cart.items.length > 0;

    useEffect(() => {
        if (!key || !hasItems) return;
        const controller = new AbortController();

        const timer = setTimeout(() => {
            fetchCouponQuote(cart, controller.signal)
                .then((outcome) => {
                    if (controller.signal.aborted) return;
                    if (outcome.kind === 'ok') {
                        setQuote({ key, couponDiscount: outcome.couponDiscount });
                    } else if (outcome.kind === 'invalid-coupon') {
                        setInvalidCoupon(true);
                        updateCart((c) => setCoupon(c, null));
                    } else if (outcome.kind === 'outdated') {
                        updateCart((c) => reconcileCart(c, outcome.issues));
                    } else {
                        setQuote({ key, error: QUOTE_UNAVAILABLE });
                    }
                })
                .catch(() => {
                    if (!controller.signal.aborted) setQuote({ key, error: QUOTE_UNAVAILABLE });
                });
        }, QUOTE_DEBOUNCE_MS);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [cart, key, hasItems]);

    const current = quote && quote.key === key ? quote : null;
    const couponDiscount = current && 'couponDiscount' in current ? current.couponDiscount : 0;
    const couponError = invalidCoupon ? INVALID_COUPON : current && 'error' in current ? current.error : null;

    const totals = useMemo(() => cartTotals(cart, couponDiscount), [cart, couponDiscount]);
    const value = useMemo(
        () => ({
            cart,
            totals,
            open,
            setOpen,
            add,
            setQty,
            remove,
            couponCode: cart.couponCode,
            couponDiscount: totals.couponDiscount,
            couponError,
            applyCoupon,
            removeCoupon,
            clear,
        }),
        [cart, totals, open, add, setQty, remove, couponError, applyCoupon, removeCoupon, clear],
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used inside CartProvider');
    return context;
}
