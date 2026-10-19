import { ShoppingBasket } from 'lucide-react';
import { OrdersList } from '@/components/orders/orders-list';
import { TitlePill } from '@/components/common/title-pill';

export const metadata = { title: 'Meus pedidos' };

export default function OrdersPage() {
    return (
        <div className="mx-auto w-full max-w-[960px] px-4 py-8 md:px-10">
            <TitlePill icon={<ShoppingBasket aria-hidden className="size-5" />}>Meus pedidos</TitlePill>
            <OrdersList />
        </div>
    );
}
