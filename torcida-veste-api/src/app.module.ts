import { Module } from '@nestjs/common';
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

@Module({
    imports: [
        AddressModule,
        AuthModule,
        CategoryModule,
        CouponModule,
        LeagueModule,
        ProductModule,
        SharedModule,
        UsersModule,
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
