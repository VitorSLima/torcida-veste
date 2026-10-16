import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { validateEnv } from './config/env';

async function bootstrap() {
    const { corsOrigins } = validateEnv(process.env);

    const app = await NestFactory.create(AppModule, { rawBody: true });

    app.enableCors({
        origin: corsOrigins,
        credentials: true,
    });

    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
