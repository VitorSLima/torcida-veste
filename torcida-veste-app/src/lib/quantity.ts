export const MAX_QUANTITY = 10;

export function clampQuantity(value: number): number {
    if (!Number.isFinite(value)) return 1;
    return Math.min(MAX_QUANTITY, Math.max(1, Math.trunc(value)));
}
