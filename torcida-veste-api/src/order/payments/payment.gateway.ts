export type CheckoutLine = { name: string; unitAmount: number; quantity: number; imageUrl?: string };

export type CheckoutInput = {
    orderId: string;
    lines: CheckoutLine[];
    couponAmount: number;
    couponName?: string;
    shippingAmount: number;
    successUrl: string;
    cancelUrl: string;
    expiresAt: number;
};

export type PaymentEvent = {
    type: 'paid' | 'expired' | 'ignored';
    sessionId?: string;
    orderId?: string;
};

// Valores em centavos. Classe abstrata para servir de token de injeção do Nest.
export abstract class PaymentGateway {
    abstract createCheckoutSession(input: CheckoutInput): Promise<{ id: string; url: string }>;
    abstract parseWebhook(rawBody: Buffer, signature: string): PaymentEvent;
}
