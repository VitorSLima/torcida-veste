import { validateEnv } from './env';

const base = {
    JWT_SECRET: 's3cret',
    DATABASE_URL: 'postgresql://u:p@localhost:5433/db',
    FRONTEND_URL: 'http://localhost:3001',
} as NodeJS.ProcessEnv;

describe('validateEnv', () => {
    it('accepts a valid env and defaults CORS to FRONTEND_URL', () => {
        expect(validateEnv(base)).toEqual({
            frontendUrl: 'http://localhost:3001',
            corsOrigins: ['http://localhost:3001'],
        });
    });

    it('reports missing JWT_SECRET', () => {
        expect(() => validateEnv({ ...base, JWT_SECRET: '' })).toThrow(
            /JWT_SECRET/,
        );
    });

    it('reports missing DATABASE_URL', () => {
        expect(() => validateEnv({ ...base, DATABASE_URL: undefined })).toThrow(
            /DATABASE_URL/,
        );
    });

    it('rejects an invalid FRONTEND_URL', () => {
        expect(() => validateEnv({ ...base, FRONTEND_URL: 'nope' })).toThrow(
            /FRONTEND_URL/,
        );
        expect(() => validateEnv({ ...base, FRONTEND_URL: undefined })).toThrow(
            /FRONTEND_URL/,
        );
    });

    it('strips the trailing slash from FRONTEND_URL', () => {
        const { frontendUrl, corsOrigins } = validateEnv({
            ...base,
            FRONTEND_URL: 'https://shop.example.com/',
        });
        expect(frontendUrl).toBe('https://shop.example.com');
        expect(corsOrigins).toEqual(['https://shop.example.com']);
    });

    it('trims and normalizes CORS_ORIGINS entries', () => {
        const { corsOrigins } = validateEnv({
            ...base,
            CORS_ORIGINS: ' http://a.com/ , https://b.com:8080 ',
        });
        expect(corsOrigins).toEqual(['http://a.com', 'https://b.com:8080']);
    });

    it('rejects a bad CORS entry', () => {
        expect(() =>
            validateEnv({ ...base, CORS_ORIGINS: 'http://a.com,bad' }),
        ).toThrow(/CORS_ORIGINS/);
    });

    it('reports multiple problems together', () => {
        let message = '';
        try {
            validateEnv({} as NodeJS.ProcessEnv);
        } catch (e) {
            message = e.message;
        }
        expect(message).toMatch(/JWT_SECRET/);
        expect(message).toMatch(/DATABASE_URL/);
        expect(message).toMatch(/FRONTEND_URL/);
    });
});
