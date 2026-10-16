export type OrderStatus = 'PENDING_PAYMENT' | 'PAID' | 'RECEIVED' | 'PROCESSING' | 'SENT' | 'CONCLUDED' | 'CANCELED';

export type OrderItemView = {
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    originalPrice: number | null;
    image: string | null;
};

export type Order = {
    id: string;
    number: number;
    status: OrderStatus;
    createdAt: string;
    subtotal: number;
    shipping: number;
    discount: number;
    couponDiscount: number;
    total: number;
    couponCode: string | null;
    paymentUrl: string | null;
    items: OrderItemView[];
};
