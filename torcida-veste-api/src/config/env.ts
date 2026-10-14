export interface ValidatedEnv {
    frontendUrl: string;
    corsOrigins: string[];
}

function parseUrl(value: string): URL | null {
    try {
        return new URL(value);
    } catch {
        return null;
    }
}

export function validateEnv(env: NodeJS.ProcessEnv): ValidatedEnv {
    const problems: string[] = [];

    if (!env.JWT_SECRET?.trim()) problems.push('JWT_SECRET is required');
    if (!env.DATABASE_URL?.trim()) problems.push('DATABASE_URL is required');

    let frontendUrl = '';
    const frontend = env.FRONTEND_URL?.trim()
        ? parseUrl(env.FRONTEND_URL.trim())
        : null;
    if (!frontend) {
        problems.push('FRONTEND_URL must be a valid URL');
    } else {
        frontendUrl = env.FRONTEND_URL!.trim().replace(/\/+$/, '');
    }

    const corsOrigins: string[] = [];
    const rawCors = env.CORS_ORIGINS?.trim() ? env.CORS_ORIGINS : frontendUrl;
    if (frontend || env.CORS_ORIGINS?.trim()) {
        for (const entry of rawCors.split(',')) {
            const candidate = entry.trim();
            const url = candidate ? parseUrl(candidate) : null;
            if (!url) {
                problems.push(
                    `CORS_ORIGINS contains an invalid URL: "${candidate}"`,
                );
            } else {
                corsOrigins.push(url.origin);
            }
        }
    }

    if (problems.length > 0) {
        throw new Error(`Invalid environment: ${problems.join('; ')}`);
    }

    return { frontendUrl, corsOrigins };
}
