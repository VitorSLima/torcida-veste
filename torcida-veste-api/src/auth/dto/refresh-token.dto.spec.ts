import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RefreshTokenDto } from './refresh-token.dto';

const parse = (plain: object) => plainToInstance(RefreshTokenDto, plain);

describe('RefreshTokenDto', () => {
    it('accepts 80 hex chars', async () => {
        const dto = parse({ refresh_token: 'a1'.repeat(40) });
        expect(await validate(dto)).toHaveLength(0);
    });

    it('rejects an empty body', async () => {
        expect(await validate(parse({}))).not.toHaveLength(0);
    });

    it('rejects an object value', async () => {
        expect(
            await validate(parse({ refresh_token: { not: '' } })),
        ).not.toHaveLength(0);
    });

    it('rejects a too-short hex string', async () => {
        expect(
            await validate(parse({ refresh_token: 'abcd' })),
        ).not.toHaveLength(0);
    });

    it('rejects 80 non-hex chars', async () => {
        expect(
            await validate(parse({ refresh_token: 'z'.repeat(80) })),
        ).not.toHaveLength(0);
    });
});
