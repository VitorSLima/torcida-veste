import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { validateEnv } from './config/env';

async function bootstrap() {
    const { corsOrigins } = validateEnv(process.env);

    const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });

    app.disable('x-powered-by');
    app.set('trust proxy', 1);
    app.use(
        helmet({
            // JSON API: nothing it returns should ever be rendered, framed or embedded.
            contentSecurityPolicy: {
                useDefaults: false,
                directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"], baseUri: ["'none'"], formAction: ["'none'"] },
            },
            crossOriginResourcePolicy: { policy: 'same-site' },
            referrerPolicy: { policy: 'no-referrer' },
        }),
    );
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

    app.enableCors({
        origin: corsOrigins,
        credentials: true,
    });

    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
