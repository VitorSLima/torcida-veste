'use client';

import { createContext, useCallback, useContext, useMemo, useState, useSyncExternalStore } from 'react';
import { addItem, cartTotals, removeItem, setQuantity, type Cart, type CartProduct } from '@/lib/cart';
import { getServerSnapshot, getSnapshot, subscribe, updateCart } from './cart-store';

type CartState = {
    cart: Cart;
    totals: ReturnType<typeof cartTotals>;
    open: boolean;
    setOpen: (open: boolean) => void;
    add: (product: CartProduct, quantity: number) => void;
    setQty: (productId: string, quantity: number) => void;
    remove: (productId: string) => void;
};

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const cart = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    const [open, setOpen] = useState(false);

    const add = useCallback((product: CartProduct, quantity: number) => {
        updateCart((current) => addItem(current, product, quantity));
        setOpen(true);
    }, []);
    const setQty = useCallback((id: string, quantity: number) => updateCart((c) => setQuantity(c, id, quantity)), []);
    const remove = useCallback((id: string) => updateCart((c) => removeItem(c, id)), []);

    const totals = useMemo(() => cartTotals(cart), [cart]);
    const value = useMemo(
        () => ({ cart, totals, open, setOpen, add, setQty, remove }),
        [cart, totals, open, add, setQty, remove],
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    const context = useContext(CartContext);
    if (!context) throw new Error('useCart must be used inside CartProvider');
    return context;
}
