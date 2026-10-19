import { BadRequestException, ServiceUnavailableException } from '@nestjs/common';
import Stripe = require('stripe');
import { StripeGateway } from './stripe.gateway';

const SECRET = 'whsec_test_secret';

function signed(payload: object, secret = SECRET) {
    const body = JSON.stringify(payload);
    const signature = new Stripe('sk_test_unused').webhooks.generateTestHeaderString({ payload: body, secret });
    return { raw: Buffer.from(body), signature };
}

const sessionEvent = (type: string, object: Record<string, unknown>) => ({
    id: 'evt_1',
    object: 'event',
    type,
    data: { object: { object: 'checkout.session', id: 'cs_test_1', metadata: { orderId: 'order-1' }, ...object } },
});

describe('StripeGateway', () => {
    const gateway = new StripeGateway();
    const original = { ...process.env };

    beforeEach(() => {
        process.env.STRIPE_WEBHOOK_SECRET = SECRET;
        delete process.env.STRIPE_SECRET_KEY;
    });
    afterEach(() => {
        process.env = { ...original };
    });

    describe('parseWebhook', () => {
        it('maps a paid completed session to paid', () => {
            const { raw, signature } = signed(sessionEvent('checkout.session.completed', { payment_status: 'paid' }));
            expect(gateway.parseWebhook(raw, signature)).toEqual({
                type: 'paid',
                sessionId: 'cs_test_1',
                orderId: 'order-1',
            });
        });

        it('ignores a completed session that is not paid', () => {
            const { raw, signature } = signed(sessionEvent('checkout.session.completed', { payment_status: 'unpaid' }));
            expect(gateway.parseWebhook(raw, signature)).toEqual({ type: 'ignored' });
        });

        it('maps an expired session to expired', () => {
            const { raw, signature } = signed(sessionEvent('checkout.session.expired', { payment_status: 'unpaid' }));
            expect(gateway.parseWebhook(raw, signature)).toEqual({
                type: 'expired',
                sessionId: 'cs_test_1',
                orderId: 'order-1',
            });
        });

        it('ignores unrelated event types', () => {
            const { raw, signature } = signed(sessionEvent('charge.succeeded', {}));
            expect(gateway.parseWebhook(raw, signature)).toEqual({ type: 'ignored' });
        });

        it('rejects a signature made with another secret', () => {
            const { raw, signature } = signed(
                sessionEvent('checkout.session.completed', { payment_status: 'paid' }),
                'whsec_other',
            );
            expect(() => gateway.parseWebhook(raw, signature)).toThrow(BadRequestException);
        });

        it('rejects a tampered payload', () => {
            const { signature } = signed(sessionEvent('checkout.session.completed', { payment_status: 'paid' }));
            const tampered = Buffer.from(JSON.stringify(sessionEvent('checkout.session.completed', { payment_status: 'paid', id: 'cs_evil' })));
            expect(() => gateway.parseWebhook(tampered, signature)).toThrow(BadRequestException);
        });

        it('throws 503 when the webhook secret is not configured', () => {
            delete process.env.STRIPE_WEBHOOK_SECRET;
            const { raw, signature } = signed(sessionEvent('checkout.session.completed', { payment_status: 'paid' }));
            expect(() => gateway.parseWebhook(raw, signature)).toThrow(ServiceUnavailableException);
        });
    });

    describe('createCheckoutSession', () => {
        it('throws 503 when STRIPE_SECRET_KEY is not configured', async () => {
            await expect(
                gateway.createCheckoutSession({
                    orderId: 'o1',
                    lines: [{ name: 'Camisa', unitAmount: 6990, quantity: 1 }],
                    couponAmount: 0,
                    shippingAmount: 500,
                    successUrl: 'http://x/ok',
                    cancelUrl: 'http://x/no',
                    expiresAt: 1,
                }),
            ).rejects.toBeInstanceOf(ServiceUnavailableException);
        });
    });
});
