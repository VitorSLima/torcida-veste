import { Injectable, Logger } from '@nestjs/common';
import { PaymentEvent } from '../payments/payment.gateway';
import { OrdersRepository } from '../repository/orders.repository';

@Injectable()
export class HandlePaymentEventUseCase {
    constructor(
        private readonly ordersRepository: OrdersRepository,
        private readonly logger: Logger = new Logger(HandlePaymentEventUseCase.name),
    ) {}

    async execute(event: PaymentEvent) {
        if (event.type === 'ignored' || !event.orderId || !event.sessionId) {
            return { received: true };
        }

        const target = event.type === 'paid' ? 'PAID' : 'CANCELED';
        const changed = await this.ordersRepository.transition(
            { id: event.orderId, paymentId: event.sessionId },
            'PENDING_PAYMENT',
            target,
        );

        this.logger.log(`Order ${event.orderId} -> ${target}: ${changed ? 'updated' : 'no-op'}`, HandlePaymentEventUseCase.name);
        return { received: true };
    }
}
