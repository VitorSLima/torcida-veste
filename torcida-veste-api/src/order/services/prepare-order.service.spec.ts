import { BadRequestException } from '@nestjs/common';
import { CartOutdatedException } from '../errors/cart-outdated.exception';
import { PrepareOrderService } from './prepare-order.service';

const p1 = { id: 'p1', name: 'Camiseta', price: 69.9, originalPrice: 139.9, stock_status: 'IN_STOCK', Images: [] };
const p2 = { id: 'p2', name: 'Conjunto', price: 159.9, originalPrice: 199.9, stock_status: 'IN_STOCK', Images: [] };

describe('PrepareOrderService', () => {
    const makeSut = (products: any[] = [p1, p2]) => {
        const productsRepository = { findProductsByIds: jest.fn().mockResolvedValue(products) };
        const couponsRepository = { findCouponByCode: jest.fn() };
        const sut = new PrepareOrderService(productsRepository as any, couponsRepository as any);
        return { sut, productsRepository, couponsRepository };
    };
    const items = [
        { productId: 'p2', quantity: 2, unitPrice: 159.9 },
        { productId: 'p1', quantity: 1, unitPrice: 69.9 },
    ];
    const issuesOf = async (promise: Promise<unknown>) => {
        try {
            await promise;
        } catch (error) {
            expect(error).toBeInstanceOf(CartOutdatedException);
            return (error as CartOutdatedException).items;
        }
        throw new Error('expected CartOutdatedException');
    };

    it('prices a valid cart and keeps the input order', async () => {
        const { sut } = makeSut();
        const result = await sut.prepare({ items });
        expect(result.lines.map((l) => l.product.id)).toEqual(['p2', 'p1']);
        expect(result.coupon).toBeNull();
        expect(result.pricing).toEqual({ subtotal: 539.7, shipping: 0, discount: 150, couponDiscount: 0, total: 389.7 });
    });

    it('rejects repeated product ids', async () => {
        const { sut } = makeSut();
        await expect(
            sut.prepare({ items: [{ productId: 'p1', quantity: 1 }, { productId: 'p1', quantity: 2 }] }),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('reports a missing product as NOT_FOUND', async () => {
        const { sut } = makeSut([p1]);
        const issues = await issuesOf(sut.prepare({ items }));
        expect(issues).toEqual([{ productId: 'p2', reason: 'NOT_FOUND' }]);
    });

    it('reports OUT_OF_STOCK', async () => {
        const { sut } = makeSut([{ ...p1, stock_status: 'OUT_OF_STOCK' }, p2]);
        const issues = await issuesOf(sut.prepare({ items }));
        expect(issues).toEqual([{ productId: 'p1', reason: 'OUT_OF_STOCK' }]);
    });

    it('reports PRICE_CHANGED comparing in cents, and ignores a missing unitPrice', async () => {
        const { sut } = makeSut();
        const issues = await issuesOf(sut.prepare({ items: [{ productId: 'p1', quantity: 1, unitPrice: 59.9 }] }));
        expect(issues).toEqual([{ productId: 'p1', reason: 'PRICE_CHANGED', price: 69.9, originalPrice: 139.9 }]);

        await expect(sut.prepare({ items: [{ productId: 'p1', quantity: 1 }] })).resolves.toBeDefined();
        // float noise must not count as a change
        await expect(sut.prepare({ items: [{ productId: 'p1', quantity: 1, unitPrice: 69.9 + 1e-9 }] })).resolves.toBeDefined();
    });

    it('collects every problem in a single exception', async () => {
        const { sut } = makeSut([{ ...p1, price: 80 }]);
        const issues = await issuesOf(sut.prepare({ items }));
        expect(issues.map((i) => [i.productId, i.reason])).toEqual([
            ['p2', 'NOT_FOUND'],
            ['p1', 'PRICE_CHANGED'],
        ]);
    });

    describe('coupon', () => {
        const future = new Date(Date.now() + 86_400_000).toISOString();

        it('applies a valid coupon, trimming the code', async () => {
            const { sut, couponsRepository } = makeSut();
            couponsRepository.findCouponByCode.mockResolvedValue({
                id: 'c1', code: 'TORCIDA10', discount_type: 'PERCENTAGE', value: 10, expiration_at: future,
            });
            const result = await sut.prepare({ items, couponCode: ' torcida10 ' });
            expect(couponsRepository.findCouponByCode).toHaveBeenCalledWith('torcida10');
            expect(result.coupon).toMatchObject({ id: 'c1' });
            expect(result.pricing.couponDiscount).toBe(38.97);
        });

        it('rejects unknown and expired coupons', async () => {
            const { sut, couponsRepository } = makeSut();
            couponsRepository.findCouponByCode.mockResolvedValue(null);
            await expect(sut.prepare({ items, couponCode: 'X' })).rejects.toThrow(
                new BadRequestException('Invalid or expired coupon'),
            );
            couponsRepository.findCouponByCode.mockResolvedValue({
                id: 'c1', code: 'OLD', discount_type: 'PERCENTAGE', value: 10, expiration_at: '2020-01-01T00:00:00.000Z',
            });
            await expect(sut.prepare({ items, couponCode: 'OLD' })).rejects.toThrow(
                new BadRequestException('Invalid or expired coupon'),
            );
        });

        it('does not touch the coupons repository without a code', async () => {
            const { sut, couponsRepository } = makeSut();
            await sut.prepare({ items });
            await sut.prepare({ items, couponCode: '   ' });
            expect(couponsRepository.findCouponByCode).not.toHaveBeenCalled();
        });
    });
});
