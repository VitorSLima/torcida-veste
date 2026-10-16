import { BadRequestException } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentGateway } from './payments/payment.gateway';
import { HandlePaymentEventUseCase } from './use-cases/handle-payment-event.use-case';

describe('PaymentsController', () => {
    const parseWebhook = jest.fn();
    const execute = jest.fn();
    const controller = new PaymentsController(
        { parseWebhook } as unknown as PaymentGateway,
        { execute } as unknown as HandlePaymentEventUseCase,
    );
    const req = (rawBody?: Buffer) => ({ rawBody }) as never;

    beforeEach(() => jest.clearAllMocks());

    it('rejects a missing signature', () => {
        expect(() => controller.webhook(req(Buffer.from('{}')), undefined)).toThrow(BadRequestException);
        expect(parseWebhook).not.toHaveBeenCalled();
    });

    it('rejects a missing raw body', () => {
        expect(() => controller.webhook(req(undefined), 't=1,v1=x')).toThrow(BadRequestException);
    });

    it('parses the event and hands it to the use case', () => {
        const event = { type: 'paid', sessionId: 's' };
        parseWebhook.mockReturnValue(event);
        execute.mockReturnValue({ received: true });
        const body = Buffer.from('{}');
        expect(controller.webhook(req(body), 'sig')).toEqual({ received: true });
        expect(parseWebhook).toHaveBeenCalledWith(body, 'sig');
        expect(execute).toHaveBeenCalledWith(event);
    });
});
