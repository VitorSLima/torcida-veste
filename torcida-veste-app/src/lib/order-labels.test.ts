import { describe, expect, it } from 'vitest';
import { formatOrderDate, formatOrderNumber, statusLabel, statusTone } from './order-labels';

describe('formatOrderNumber', () => {
    it('pads to three digits', () => {
        expect(formatOrderNumber(1)).toBe('#001');
        expect(formatOrderNumber(42)).toBe('#042');
        expect(formatOrderNumber(1234)).toBe('#1234');
    });
});

describe('formatOrderDate', () => {
    it('uses the America/Sao_Paulo day', () => {
        expect(formatOrderDate('2026-10-16T02:30:00.000Z')).toBe('15/10/26');
        expect(formatOrderDate('2026-10-16T15:00:00.000Z')).toBe('16/10/26');
    });
});

describe('statusLabel / statusTone', () => {
    it.each([
        ['PENDING_PAYMENT', 'Aguardando pagamento', 'warning'],
        ['PAID', 'Pago', 'success'],
        ['PROCESSING', 'Em preparação', 'success'],
        ['SENT', 'Enviado', 'success'],
        ['CONCLUDED', 'Concluído', 'success'],
        ['RECEIVED', 'Recebido', 'success'],
        ['CANCELED', 'Cancelado', 'danger'],
    ] as const)('%s', (status, label, tone) => {
        expect(statusLabel(status)).toBe(label);
        expect(statusTone(status)).toBe(tone);
    });
});
