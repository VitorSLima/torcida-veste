import { describe, expect, it } from 'vitest';
import { validateLogin, validateRegister } from './auth-schema';

describe('validateLogin', () => {
    it('accepts valid input and trims the email', () => {
        expect(validateLogin({ email: ' a@b.com ', password: 'x' })).toEqual({
            ok: true,
            data: { email: 'a@b.com', password: 'x' },
        });
    });
    it('reports email and password errors', () => {
        const result = validateLogin({ email: 'nope', password: '' });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(['email', 'password']);
    });
    it('survives non-object input', () => {
        expect(validateLogin(null).ok).toBe(false);
        expect(validateLogin('x').ok).toBe(false);
    });
});

describe('validateRegister', () => {
    const valid = { firstName: 'Ana', lastName: 'Silva', email: 'a@b.com', password: '12345678' };
    it('accepts valid input', () => {
        expect(validateRegister(valid)).toEqual({ ok: true, data: valid });
    });
    it('requires names and an 8+ char password', () => {
        const result = validateRegister({ ...valid, firstName: ' ', lastName: '', password: '1234567' });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(['firstName', 'lastName', 'password']);
    });
    it('rejects passwords above 72 characters', () => {
        const result = validateRegister({ ...valid, password: 'a'.repeat(73) });
        expect(result.ok).toBe(false);
    });
    it('does not forward unknown fields', () => {
        const result = validateRegister({ ...valid, role: 'ADMIN' });
        expect(result.ok && 'role' in result.data).toBe(false);
    });
});

describe('size limits', () => {
    it('rejects oversized login fields', () => {
        const result = validateLogin({ email: `${'a'.repeat(250)}@b.com`, password: 'x'.repeat(73) });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(['email', 'password']);
    });
    it('rejects oversized names and e-mail on register', () => {
        const result = validateRegister({
            firstName: 'a'.repeat(81),
            lastName: 'b'.repeat(81),
            email: `${'c'.repeat(250)}@d.com`,
            password: '12345678',
        });
        expect(result.ok).toBe(false);
        if (!result.ok) expect(Object.keys(result.errors).sort()).toEqual(['email', 'firstName', 'lastName']);
    });
});
