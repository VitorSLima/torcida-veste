import { ConflictException, NotFoundException } from '@nestjs/common';
import { DeleteProductUseCase } from './delete-product.use-case';

describe('DeleteProductUseCase', () => {
    const makeSut = () => {
        const repo = { findProductsById: jest.fn(), deleteProduct: jest.fn() };
        const logger = { log: jest.fn(), error: jest.fn() };
        const sut = new DeleteProductUseCase(repo as any, logger as any);
        return { sut, repo };
    };

    it('throws NotFoundException and does not delete when missing', async () => {
        const { sut, repo } = makeSut();
        repo.findProductsById.mockResolvedValue(null);
        await expect(sut.execute('p1')).rejects.toBeInstanceOf(NotFoundException);
        expect(repo.deleteProduct).not.toHaveBeenCalled();
    });

    it('awaits deletion and returns the product', async () => {
        const { sut, repo } = makeSut();
        const product = { id: 'p1' };
        repo.findProductsById.mockResolvedValue(product);
        let done = false;
        repo.deleteProduct.mockImplementation(async () => {
            await Promise.resolve();
            done = true;
        });
        await expect(sut.execute('p1')).resolves.toEqual({ product });
        expect(done).toBe(true);
        expect(repo.deleteProduct).toHaveBeenCalledWith('p1');
    });

    it('maps FK violations (P2003) to ConflictException', async () => {
        const { sut, repo } = makeSut();
        repo.findProductsById.mockResolvedValue({ id: 'p1' });
        repo.deleteProduct.mockRejectedValue({ code: 'P2003' });
        await expect(sut.execute('p1')).rejects.toBeInstanceOf(ConflictException);
    });

    it('rethrows other errors unchanged', async () => {
        const { sut, repo } = makeSut();
        const err = new Error('boom');
        repo.findProductsById.mockResolvedValue({ id: 'p1' });
        repo.deleteProduct.mockRejectedValue(err);
        await expect(sut.execute('p1')).rejects.toBe(err);
    });
});
