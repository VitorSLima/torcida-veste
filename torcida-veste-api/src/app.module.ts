import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CategoryModule } from './category/category.module';
import { CouponModule } from './coupon/coupon.module';
import { LeagueModule } from './league/league.module';
import { SharedModule } from './shared/shared.module';
import { UsersModule } from './users/users.module';
import { ProductModule } from './product/product.module';
import { AddressModule } from './address/address.module';
import { OrderModule } from './order/order.module';
import { RequestThrottlerGuard } from './security/request-throttler.guard';

@Module({
    imports: [
        ThrottlerModule.forRoot([{ ttl: 60_000, limit: 300 }]),
        AddressModule,
        AuthModule,
        CategoryModule,
        CouponModule,
        LeagueModule,
        OrderModule,
        ProductModule,
        SharedModule,
        UsersModule,
    ],
    controllers: [AppController],
    providers: [AppService, { provide: APP_GUARD, useClass: RequestThrottlerGuard }],
})
export class AppModule {}
