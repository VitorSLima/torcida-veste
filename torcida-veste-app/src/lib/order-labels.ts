import type { OrderStatus } from './order-types';

export type StatusTone = 'warning' | 'success' | 'danger';

const dateFormat = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
});

const STATUS: Record<OrderStatus, { label: string; tone: StatusTone }> = {
    PENDING_PAYMENT: { label: 'Aguardando pagamento', tone: 'warning' },
    PAID: { label: 'Pago', tone: 'success' },
    RECEIVED: { label: 'Recebido', tone: 'success' },
    PROCESSING: { label: 'Em preparação', tone: 'success' },
    SENT: { label: 'Enviado', tone: 'success' },
    CONCLUDED: { label: 'Concluído', tone: 'success' },
    CANCELED: { label: 'Cancelado', tone: 'danger' },
};

export const formatOrderNumber = (number: number) => `#${String(number).padStart(3, '0')}`;

export const formatOrderDate = (iso: string) => dateFormat.format(new Date(iso));

export const statusLabel = (status: OrderStatus) => STATUS[status].label;

export const statusTone = (status: OrderStatus): StatusTone => STATUS[status].tone;
