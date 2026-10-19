import { OrderPoller } from '@/components/checkout/order-poller';

export const metadata = { title: 'Pedido realizado' };

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ order?: string | string[] }> }) {
    const { order } = await searchParams;
    const id = typeof order === 'string' ? order : '';

    return <OrderPoller orderId={id} />;
}
