import { BadRequestException, Controller, Headers, HttpCode, Post, RawBodyRequest, Req } from '@nestjs/common';
import { Request } from 'express';
import { PaymentGateway } from './payments/payment.gateway';
import { HandlePaymentEventUseCase } from './use-cases/handle-payment-event.use-case';

@Controller('payments')
export class PaymentsController {
    constructor(
        private readonly gateway: PaymentGateway,
        private readonly handleEvent: HandlePaymentEventUseCase,
    ) {}

    @Post('webhook')
    @HttpCode(200)
    webhook(@Req() req: RawBodyRequest<Request>, @Headers('stripe-signature') signature?: string) {
        if (!req.rawBody || !signature) throw new BadRequestException('Missing payload or signature');
        return this.handleEvent.execute(this.gateway.parseWebhook(req.rawBody, signature));
    }
}
