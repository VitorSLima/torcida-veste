import { HandlePaymentEventUseCase } from './handle-payment-event.use-case';

const makeSut = (count = 1) => {
    const orders = { transition: jest.fn().mockResolvedValue(count) };
    const logger = { log: jest.fn(), error: jest.fn() };
    return { sut: new HandlePaymentEventUseCase(orders as any, logger as any), orders };
};

describe('HandlePaymentEventUseCase', () => {
    it('marks the order as paid only if it is still pending and the session matches', async () => {
        const { sut, orders } = makeSut();
        expect(await sut.execute({ type: 'paid', sessionId: 'cs_1', orderId: 'o1' })).toEqual({ received: true });
        expect(orders.transition).toHaveBeenCalledWith({ id: 'o1', paymentId: 'cs_1' }, 'PENDING_PAYMENT', 'PAID');
    });

    it('is idempotent: a replay changes nothing and still answers received', async () => {
        const { sut } = makeSut(0);
        expect(await sut.execute({ type: 'paid', sessionId: 'cs_1', orderId: 'o1' })).toEqual({ received: true });
    });

    it('cancels the order when the session expires', async () => {
        const { sut, orders } = makeSut();
        await sut.execute({ type: 'expired', sessionId: 'cs_1', orderId: 'o1' });
        expect(orders.transition).toHaveBeenCalledWith({ id: 'o1', paymentId: 'cs_1' }, 'PENDING_PAYMENT', 'CANCELED');
    });

    it('ignores unknown events and events without order metadata', async () => {
        const { sut, orders } = makeSut();
        expect(await sut.execute({ type: 'ignored' })).toEqual({ received: true });
        expect(await sut.execute({ type: 'paid', sessionId: 'cs_1' })).toEqual({ received: true });
        expect(orders.transition).not.toHaveBeenCalled();
    });
});
