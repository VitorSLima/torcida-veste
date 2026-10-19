import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { toOrderResponse } from '../order.mapper';
import { OrdersRepository } from '../repository/orders.repository';

@Injectable()
export class FindOrderUseCase {
    constructor(
        private readonly ordersRepository: OrdersRepository,
        private readonly logger: Logger = new Logger(FindOrderUseCase.name),
    ) {}

    async execute(userId: string, id: string) {
        const order = await this.ordersRepository.findByIdForUser(id, userId);
        if (!order) {
            this.logger.error(`Order ${id} not found for user ${userId}`);
            throw new NotFoundException('Order not found');
        }
        return toOrderResponse(order);
    }
}
