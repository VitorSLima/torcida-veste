import { Global, Module } from '@nestjs/common';
import { PrismaService } from './databases/prisma.database';
import { EncryptProvider } from './providers/encrypt.provider';
import { GenerateIdProvider } from './providers/generate-id.provider';
import { GenerateHashCodeProvider } from './providers/generate-hash-code.provider';
import { DateHandlingProvider } from './providers/date.provider';
import { Logger } from '@nestjs/common';

@Global()
@Module({
    providers: [
        PrismaService,
        EncryptProvider,
        GenerateIdProvider,
        GenerateHashCodeProvider,
        DateHandlingProvider,
        Logger,
    ],
    exports: [
        PrismaService,
        EncryptProvider,
        GenerateIdProvider,
        GenerateHashCodeProvider,
        DateHandlingProvider,
    ],
})
export class SharedModule {}
