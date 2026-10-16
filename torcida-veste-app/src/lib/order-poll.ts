import type { Order } from './order-types';

export const MAX_POLL_ATTEMPTS = 10;
export const POLL_INTERVAL_MS = 2000;

export type PollState = 'pending' | 'paid' | 'canceled' | 'exhausted';

/** `attempt` is the number of polls already made, including the one that produced `order` (null = fetch failed). */
export function nextPollState(order: Pick<Order, 'status'> | null, attempt: number): PollState {
    if (order?.status === 'CANCELED') return 'canceled';
    if (order && order.status !== 'PENDING_PAYMENT') return 'paid';
    return attempt >= MAX_POLL_ATTEMPTS ? 'exhausted' : 'pending';
}
