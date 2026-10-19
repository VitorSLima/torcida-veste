import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

const valid = { email: 'a@b.com', password: '12345678', firstName: 'Ana', lastName: 'Silva' };
const errorsFor = async (data: object) =>
    (await validate(plainToInstance(RegisterDto, data))).map((e) => e.property).sort();

describe('RegisterDto', () => {
    it('accepts a normal registration', async () => {
        expect(await errorsFor(valid)).toEqual([]);
    });

    it('caps names and e-mail length', async () => {
        const errors = await errorsFor({
            ...valid,
            firstName: 'a'.repeat(81),
            lastName: 'b'.repeat(81),
            email: `${'c'.repeat(250)}@d.com`,
        });
        expect(errors).toEqual(['email', 'firstName', 'lastName']);
    });

    it('rejects short and overlong passwords', async () => {
        expect(await errorsFor({ ...valid, password: '1234567' })).toEqual(['password']);
        expect(await errorsFor({ ...valid, password: 'x'.repeat(73) })).toEqual(['password']);
    });
});
