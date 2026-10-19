export const SHIPPING_FLAT = 5;
export const FREE_SHIPPING_FROM = 300;

// Regra espelhada do backend (fase 4): o backend é a fonte da verdade.
export function shippingFor(payable: number): number {
    return payable <= 0 || payable >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FLAT;
}
