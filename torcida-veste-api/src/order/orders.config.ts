const numberFrom = (value: string | undefined, fallback: number) => {
    const parsed = Number(value);
    return value?.trim() && Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

export const ordersConfig = () => ({
    shippingFlat: numberFrom(process.env.SHIPPING_FLAT, 5),
    freeShippingFrom: numberFrom(process.env.FREE_SHIPPING_FROM, 300),
    frontendUrl: (process.env.FRONTEND_URL ?? '').trim().replace(/\/+$/, ''),
});
