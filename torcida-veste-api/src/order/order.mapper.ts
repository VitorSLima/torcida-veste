type OrderRow = {
    id: string;
    number: number;
    order_status: string;
    created_at: Date;
    subtotal: number;
    shipping: number;
    discount: number;
    coupon_discount: number;
    total: number;
    payment_url: string | null;
    Coupon: { code: string } | null;
    OrderItems: {
        product_id: string;
        product_name: string;
        quantity: number;
        unit_price: number;
        original_price: number | null;
        Product: { Images: { url: string; is_Cover: boolean }[] };
    }[];
};

export function toOrderResponse(order: OrderRow) {
    return {
        id: order.id,
        number: order.number,
        status: order.order_status,
        createdAt: order.created_at.toISOString(),
        subtotal: order.subtotal,
        shipping: order.shipping,
        discount: order.discount,
        couponDiscount: order.coupon_discount,
        total: order.total,
        couponCode: order.Coupon?.code ?? null,
        paymentUrl: order.order_status === 'PENDING_PAYMENT' ? order.payment_url : null,
        items: order.OrderItems.map((item) => {
            const images = item.Product.Images;
            return {
                productId: item.product_id,
                name: item.product_name,
                quantity: item.quantity,
                unitPrice: item.unit_price,
                originalPrice: item.original_price,
                image: (images.find((image) => image.is_Cover) ?? images[0])?.url ?? null,
            };
        }),
    };
}
