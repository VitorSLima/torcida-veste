import { ListOrdersUseCase } from './list-orders.use-case';

const makeRow = (id: string) => ({
    id,
    number: 1,
    order_status: 'PENDING_PAYMENT',
    created_at: new Date('2026-10-16T12:00:00.000Z'),
    subtotal: 100,
    shipping: 5,
    discount: 0,
    coupon_discount: 0,
    total: 105,
    payment_url: 'https://pay.test/cs_1',
    Coupon: null,
    OrderItems: [],
});

describe('ListOrdersUseCase', () => {
    it('lists only the orders of the user, mapped to the response shape', async () => {
        const orders = { findManyByUser: jest.fn().mockResolvedValue([makeRow('o2'), makeRow('o1')]) };
        const logger = { log: jest.fn(), error: jest.fn() };
        const sut = new ListOrdersUseCase(orders as any, logger as any);

        const result = await sut.execute('u1');

        expect(orders.findManyByUser).toHaveBeenCalledWith('u1');
        expect(result.map((order) => order.id)).toEqual(['o2', 'o1']);
        expect(result[0]).toMatchObject({ status: 'PENDING_PAYMENT', paymentUrl: 'https://pay.test/cs_1' });
    });
});
