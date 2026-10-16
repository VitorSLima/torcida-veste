import { Injectable, Logger } from '@nestjs/common';
import { toOrderResponse } from '../order.mapper';
import { OrdersRepository } from '../repository/orders.repository';

@Injectable()
export class ListOrdersUseCase {
    constructor(
        private readonly ordersRepository: OrdersRepository,
        private readonly logger: Logger = new Logger(ListOrdersUseCase.name),
    ) {}

    async execute(userId: string) {
        const orders = await this.ordersRepository.findManyByUser(userId);
        this.logger.log(`Listed ${orders.length} orders for user ${userId}`, ListOrdersUseCase.name);
        return orders.map(toOrderResponse);
    }
}
