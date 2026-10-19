import { NotFoundException } from '@nestjs/common';
import { FindOrderUseCase } from './find-order.use-case';

const row = {
    id: 'o1',
    number: 1,
    order_status: 'PAID',
    created_at: new Date('2026-10-16T12:00:00.000Z'),
    subtotal: 100,
    shipping: 5,
    discount: 0,
    coupon_discount: 0,
    total: 105,
    payment_url: 'https://pay.test/cs_1',
    Coupon: null,
    OrderItems: [],
};

const makeSut = (found: unknown = row) => {
    const orders = { findByIdForUser: jest.fn().mockResolvedValue(found) };
    const logger = { log: jest.fn(), error: jest.fn() };
    return { sut: new FindOrderUseCase(orders as any, logger as any), orders };
};

describe('FindOrderUseCase', () => {
    it('returns the mapped order of the user and queries by (id, userId)', async () => {
        const { sut, orders } = makeSut();

        const result = await sut.execute('u1', 'o1');

        expect(orders.findByIdForUser).toHaveBeenCalledWith('o1', 'u1');
        expect(result).toMatchObject({ id: 'o1', status: 'PAID', total: 105, paymentUrl: null, items: [] });
    });

    it('throws NotFoundException when the order does not exist or belongs to another user', async () => {
        const { sut } = makeSut(null);

        await expect(sut.execute('u1', 'o1')).rejects.toThrow(NotFoundException);
    });
});
