import { toOrderResponse } from './order.mapper';

const makeRow = (overrides: Record<string, unknown> = {}) => ({
    id: 'o1',
    number: 7,
    order_status: 'PENDING_PAYMENT',
    created_at: new Date('2026-10-16T12:00:00.000Z'),
    subtotal: 200,
    shipping: 5,
    discount: 50,
    coupon_discount: 10,
    total: 155,
    payment_url: 'https://pay.test/cs_1',
    Coupon: { code: 'TORCIDA10' } as { code: string } | null,
    OrderItems: [
        {
            product_id: 'p1',
            product_name: 'Camiseta',
            quantity: 2,
            unit_price: 69.9,
            original_price: 139.9 as number | null,
            Product: {
                Images: [
                    { url: '/first.png', is_Cover: false },
                    { url: '/cover.png', is_Cover: true },
                ],
            },
        },
    ],
    ...overrides,
});

describe('toOrderResponse', () => {
    it('maps fields to camelCase with an ISO date and a null coupon code when there is no coupon', () => {
        const result = toOrderResponse(makeRow({ Coupon: null }));

        expect(result).toMatchObject({
            id: 'o1',
            number: 7,
            status: 'PENDING_PAYMENT',
            createdAt: '2026-10-16T12:00:00.000Z',
            subtotal: 200,
            shipping: 5,
            discount: 50,
            couponDiscount: 10,
            total: 155,
            couponCode: null,
        });
        expect(toOrderResponse(makeRow()).couponCode).toBe('TORCIDA10');
    });

    it('uses the cover image, falls back to the first one, then null', () => {
        const item = makeRow().OrderItems[0];
        const withImages = (Images: { url: string; is_Cover: boolean }[]) =>
            toOrderResponse(makeRow({ OrderItems: [{ ...item, Product: { Images } }] })).items[0].image;

        expect(withImages(item.Product.Images)).toBe('/cover.png');
        expect(withImages([{ url: '/only.png', is_Cover: false }])).toBe('/only.png');
        expect(withImages([])).toBeNull();
    });

    it('exposes paymentUrl only while the order is pending payment', () => {
        expect(toOrderResponse(makeRow()).paymentUrl).toBe('https://pay.test/cs_1');
        expect(toOrderResponse(makeRow({ order_status: 'PAID' })).paymentUrl).toBeNull();
        expect(toOrderResponse(makeRow({ order_status: 'CANCELED' })).paymentUrl).toBeNull();
    });

    it('takes unit and original price from the item snapshot', () => {
        const [item] = toOrderResponse(makeRow()).items;

        expect(item).toEqual({
            productId: 'p1',
            name: 'Camiseta',
            quantity: 2,
            unitPrice: 69.9,
            originalPrice: 139.9,
            image: '/cover.png',
        });
    });
});
