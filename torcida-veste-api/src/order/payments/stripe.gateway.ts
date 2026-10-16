import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import Stripe = require('stripe');
import { CheckoutInput, PaymentEvent, PaymentGateway } from './payment.gateway';

@Injectable()
export class StripeGateway extends PaymentGateway {
    private client(): Stripe {
        const key = process.env.STRIPE_SECRET_KEY?.trim();
        if (!key) throw new ServiceUnavailableException('Payments are not configured');
        return new Stripe(key);
    }

    async createCheckoutSession(input: CheckoutInput) {
        const stripe = this.client();

        const discounts: Stripe.Checkout.SessionCreateParams.Discount[] = [];
        if (input.couponAmount > 0) {
            const coupon = await stripe.coupons.create({
                amount_off: input.couponAmount,
                currency: 'brl',
                duration: 'once',
                max_redemptions: 1,
                name: input.couponName,
            });
            discounts.push({ coupon: coupon.id });
        }

        const session = await stripe.checkout.sessions.create(
            {
                mode: 'payment',
                allowed_payment_method_types: ['card'],
                locale: 'pt-BR',
                client_reference_id: input.orderId,
                metadata: { orderId: input.orderId },
                line_items: input.lines.map((line) => ({
                    quantity: line.quantity,
                    price_data: {
                        currency: 'brl',
                        unit_amount: line.unitAmount,
                        product_data: { name: line.name, ...(line.imageUrl ? { images: [line.imageUrl] } : {}) },
                    },
                })),
                discounts,
                shipping_options: [
                    {
                        shipping_rate_data: {
                            type: 'fixed_amount',
                            fixed_amount: { amount: input.shippingAmount, currency: 'brl' },
                            display_name: input.shippingAmount > 0 ? 'Entrega' : 'Entrega grátis',
                        },
                    },
                ],
                success_url: input.successUrl,
                cancel_url: input.cancelUrl,
                expires_at: input.expiresAt,
            },
            { idempotencyKey: `order-${input.orderId}` },
        );

        if (!session.url) throw new Error('Stripe returned a session without url');
        return { id: session.id, url: session.url };
    }

    parseWebhook(rawBody: Buffer, signature: string): PaymentEvent {
        const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
        if (!secret) throw new ServiceUnavailableException('Webhook is not configured');

        let event: Stripe.Event;
        try {
            event = new Stripe(process.env.STRIPE_SECRET_KEY?.trim() || 'sk_test_unused').webhooks.constructEvent(
                rawBody,
                signature,
                secret,
            );
        } catch {
            throw new BadRequestException('Invalid signature');
        }

        if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.expired') {
            const session = event.data.object;
            const isPaid = event.type === 'checkout.session.completed' && session.payment_status === 'paid';
            const isExpired = event.type === 'checkout.session.expired';

            if (isPaid || isExpired) {
                return {
                    type: isPaid ? 'paid' : 'expired',
                    sessionId: session.id,
                    orderId: session.metadata?.orderId ?? undefined,
                };
            }
        }
        return { type: 'ignored' };
    }
}
