import { BadGatewayException, ConflictException, ServiceUnavailableException } from '@nestjs/common';
import { CreateOrderUseCase } from './create-order.use-case';

const prepared = {
    lines: [
        { product: { id: 'p1', name: 'Camiseta', price: 69.9, originalPrice: 139.9, Images: [{ url: '/a.png', is_Cover: true }] }, quantity: 1 },
        { product: { id: 'p2', name: 'Conjunto', price: 159.9, originalPrice: 199.9, Images: [] }, quantity: 2 },
    ],
    coupon: { id: 'c1', code: 'TORCIDA10' },
    pricing: { subtotal: 539.7, shipping: 0, discount: 142.0, couponDiscount: 38.97, total: 350.73 },
};

describe('CreateOrderUseCase', () => {
    beforeEach(() => {
        process.env.FRONTEND_URL = 'https://front.test/';
    });

    const makeSut = () => {
        const prepare = { prepare: jest.fn().mockResolvedValue(prepared) };
        const orders = {
            createPending: jest.fn().mockResolvedValue({ id: 'o1' }),
            attachPayment: jest.fn().mockResolvedValue({}),
            cancel: jest.fn().mockResolvedValue({ count: 1 }),
        };
        const gateway = { createCheckoutSession: jest.fn().mockResolvedValue({ id: 'cs_1', url: 'https://pay.test/cs_1' }) };
        const logger = { log: jest.fn(), error: jest.fn() };
        const sut = new CreateOrderUseCase(prepare as any, orders as any, gateway as any, logger as any);
        return { sut, prepare, orders, gateway };
    };
    const dto = { items: [{ productId: 'p1', quantity: 1, unitPrice: 69.9 }, { productId: 'p2', quantity: 2, unitPrice: 159.9 }], couponCode: 'torcida10' };

    it('creates the pending order, opens the session and returns the payment url', async () => {
        const { sut, orders, gateway } = makeSut();

        const result = await sut.execute('u1', dto);

        expect(result).toEqual({ orderId: 'o1', payment_url: 'https://pay.test/cs_1' });
        expect(orders.createPending).toHaveBeenCalledWith(
            expect.objectContaining({ userId: 'u1', couponId: 'c1', pricing: prepared.pricing }),
        );
        expect(orders.createPending.mock.calls[0][0].items[1]).toEqual({
            productId: 'p2', productName: 'Conjunto', quantity: 2, unitPrice: 159.9, originalPrice: 199.9,
        });
        const input = gateway.createCheckoutSession.mock.calls[0][0];
        expect(input.orderId).toBe('o1');
        expect(input.lines).toEqual([
            { name: 'Camiseta', unitAmount: 6990, quantity: 1, imageUrl: 'https://front.test/a.png' },
            { name: 'Conjunto', unitAmount: 15990, quantity: 2, imageUrl: undefined },
        ]);
        expect(input.couponAmount).toBe(3897);
        expect(input.shippingAmount).toBe(0);
        expect(input.successUrl).toBe('https://front.test/checkout/sucesso?order=o1');
        expect(input.cancelUrl).toBe('https://front.test/checkout/cancelado?order=o1');
        expect(input.expiresAt).toBeGreaterThan(Math.floor(Date.now() / 1000) + 30 * 60);
        expect(orders.attachPayment).toHaveBeenCalledWith('o1', { paymentId: 'cs_1', paymentUrl: 'https://pay.test/cs_1' });
    });

    it('does not create anything when the cart is outdated', async () => {
        const { sut, prepare, orders, gateway } = makeSut();
        prepare.prepare.mockRejectedValue(new ConflictException());
        await expect(sut.execute('u1', dto)).rejects.toBeInstanceOf(ConflictException);
        expect(orders.createPending).not.toHaveBeenCalled();
        expect(gateway.createCheckoutSession).not.toHaveBeenCalled();
    });

    it('cancels the order and answers 502 when the gateway fails', async () => {
        const { sut, orders, gateway } = makeSut();
        gateway.createCheckoutSession.mockRejectedValue(new Error('stripe down'));
        await expect(sut.execute('u1', dto)).rejects.toBeInstanceOf(BadGatewayException);
        expect(orders.cancel).toHaveBeenCalledWith('o1');
        expect(orders.attachPayment).not.toHaveBeenCalled();
    });

    it('cancels the order and keeps 503 when payments are not configured', async () => {
        const { sut, orders, gateway } = makeSut();
        gateway.createCheckoutSession.mockRejectedValue(new ServiceUnavailableException());
        await expect(sut.execute('u1', dto)).rejects.toBeInstanceOf(ServiceUnavailableException);
        expect(orders.cancel).toHaveBeenCalledWith('o1');
    });
});
