import { Injectable } from '@nestjs/common';
import { ORDER_STATUS } from '@prisma/client';
import { PrismaService } from '../../shared/databases/prisma.database';
import { Pricing } from '../pricing';

export type NewOrderItem = {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    originalPrice: number | null;
};

const orderInclude = {
    Coupon: { select: { code: true } },
    OrderItems: {
        include: { Product: { select: { Images: { select: { url: true, is_Cover: true } } } } },
    },
} as const;

@Injectable()
export class OrdersRepository {
    constructor(private readonly prisma: PrismaService) {}

    createPending(data: { userId: string; couponId: string | null; pricing: Pricing; items: NewOrderItem[] }) {
        return this.prisma.order.create({
            data: {
                user_id: data.userId,
                coupon_id: data.couponId,
                order_status: 'PENDING_PAYMENT',
                subtotal: data.pricing.subtotal,
                shipping: data.pricing.shipping,
                discount: data.pricing.discount,
                coupon_discount: data.pricing.couponDiscount,
                total: data.pricing.total,
                OrderItems: {
                    create: data.items.map((item) => ({
                        product_id: item.productId,
                        product_name: item.productName,
                        quantity: item.quantity,
                        unit_price: item.unitPrice,
                        original_price: item.originalPrice,
                    })),
                },
            },
        });
    }

    attachPayment(id: string, payment: { paymentId: string; paymentUrl: string }) {
        return this.prisma.order.update({
            where: { id },
            data: { payment_id: payment.paymentId, payment_url: payment.paymentUrl },
        });
    }

    cancel(id: string) {
        return this.prisma.order.updateMany({
            where: { id, order_status: 'PENDING_PAYMENT' },
            data: { order_status: 'CANCELED' },
        });
    }

    /** Transição condicional: devolve quantas linhas mudaram (0 = já processado ou inexistente). */
    async transition(
        where: { id: string; paymentId?: string },
        from: ORDER_STATUS,
        to: ORDER_STATUS,
    ): Promise<number> {
        const result = await this.prisma.order.updateMany({
            where: { id: where.id, order_status: from, ...(where.paymentId ? { payment_id: where.paymentId } : {}) },
            data: { order_status: to },
        });
        return result.count;
    }

    findManyByUser(userId: string) {
        return this.prisma.order.findMany({
            where: { user_id: userId },
            include: orderInclude,
            orderBy: { created_at: 'desc' },
        });
    }

    findByIdForUser(id: string, userId: string) {
        return this.prisma.order.findFirst({ where: { id, user_id: userId }, include: orderInclude });
    }
}
