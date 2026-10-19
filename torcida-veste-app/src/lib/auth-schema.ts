const MAX_NAME = 80;
const MAX_EMAIL = 254;

export type FieldErrors = Record<string, string>;
type Result<T> = { ok: true; data: T } | { ok: false; errors: FieldErrors };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const read = (input: unknown, key: string): string => {
    const value = (input as Record<string, unknown> | null)?.[key];
    return typeof value === 'string' ? value : '';
};

export type LoginData = { email: string; password: string };
export type RegisterData = LoginData & { firstName: string; lastName: string };

export function validateLogin(input: unknown): Result<LoginData> {
    const email = read(input, 'email').trim();
    const password = read(input, 'password');
    const errors: FieldErrors = {};

    if (!EMAIL.test(email) || email.length > MAX_EMAIL) errors.email = 'Informe um e-mail válido';
    if (!password) errors.password = 'Informe sua senha';
    else if (password.length > 72) errors.password = 'A senha deve ter no máximo 72 caracteres';

    return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data: { email, password } };
}

export function validateRegister(input: unknown): Result<RegisterData> {
    const firstName = read(input, 'firstName').trim();
    const lastName = read(input, 'lastName').trim();
    const email = read(input, 'email').trim();
    const password = read(input, 'password');
    const errors: FieldErrors = {};

    if (!firstName) errors.firstName = 'Informe seu nome';
    else if (firstName.length > MAX_NAME) errors.firstName = 'Nome muito longo';
    if (!lastName) errors.lastName = 'Informe seu sobrenome';
    else if (lastName.length > MAX_NAME) errors.lastName = 'Sobrenome muito longo';
    if (!EMAIL.test(email) || email.length > MAX_EMAIL) errors.email = 'Informe um e-mail válido';
    if (password.length < 8) errors.password = 'A senha deve ter pelo menos 8 caracteres';
    else if (password.length > 72) errors.password = 'A senha deve ter no máximo 72 caracteres';

    return Object.keys(errors).length
        ? { ok: false, errors }
        : { ok: true, data: { firstName, lastName, email, password } };
}
