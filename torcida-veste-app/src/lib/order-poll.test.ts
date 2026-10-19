import { describe, expect, it } from 'vitest';
import { MAX_POLL_ATTEMPTS, nextPollState } from './order-poll';

describe('nextPollState', () => {
    it('keeps waiting while the order is pending and attempts remain', () => {
        expect(nextPollState({ status: 'PENDING_PAYMENT' }, 1)).toBe('pending');
        expect(nextPollState({ status: 'PENDING_PAYMENT' }, MAX_POLL_ATTEMPTS - 1)).toBe('pending');
    });

    it('gives up when the attempts are exhausted', () => {
        expect(nextPollState({ status: 'PENDING_PAYMENT' }, MAX_POLL_ATTEMPTS)).toBe('exhausted');
        expect(nextPollState(null, MAX_POLL_ATTEMPTS)).toBe('exhausted');
    });

    it('retries when the order could not be fetched yet', () => {
        expect(nextPollState(null, 1)).toBe('pending');
    });

    it('confirms any non-pending, non-canceled status', () => {
        for (const status of ['PAID', 'RECEIVED', 'PROCESSING', 'SENT', 'CONCLUDED'] as const) {
            expect(nextPollState({ status }, 1)).toBe('paid');
        }
    });

    it('reports canceled orders immediately', () => {
        expect(nextPollState({ status: 'CANCELED' }, 1)).toBe('canceled');
    });
});
