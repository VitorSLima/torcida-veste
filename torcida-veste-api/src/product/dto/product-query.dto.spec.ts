import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ProductQueryDto } from './product-query.dto';

const parse = (plain: object) => plainToInstance(ProductQueryDto, plain);

describe('ProductQueryDto', () => {
    it('applies defaults (page 1, limit 20)', async () => {
        const dto = parse({});
        expect(await validate(dto)).toHaveLength(0);
        expect(dto.page).toBe(1);
        expect(dto.limit).toBe(20);
    });

    it('coerces numeric strings and the onSale flag', async () => {
        const dto = parse({ page: '2', limit: '10', onSale: 'true' });
        expect(await validate(dto)).toHaveLength(0);
        expect(dto.page).toBe(2);
        expect(dto.limit).toBe(10);
        expect(dto.onSale).toBe(true);
    });

    it('rejects a limit above 50', async () => {
        expect(await validate(parse({ limit: '100' }))).not.toHaveLength(0);
    });

    it('rejects page 0', async () => {
        expect(await validate(parse({ page: '0' }))).not.toHaveLength(0);
    });

    it('rejects an absurdly large page', async () => {
        expect(
            await validate(parse({ page: '100000000000000000000' })),
        ).not.toHaveLength(0);
    });

    it('rejects a search longer than 100 chars', async () => {
        expect(
            await validate(parse({ search: 'a'.repeat(101) })),
        ).not.toHaveLength(0);
    });
});
