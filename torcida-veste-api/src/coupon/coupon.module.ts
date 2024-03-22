import { Logger, Module } from '@nestjs/common';
import * as UseCases from './use-cases';
import { CouponController } from './coupon.controller';
import { CouponService } from './coupon.service';
import { CouponsRepository } from './repository/coupon.repository';

const usecases = Object.values(UseCases);

@Module({
  imports: [],
  controllers: [CouponController],
  providers: [CouponService, CouponsRepository, ...usecases, Logger],
  exports: [CouponService, CouponsRepository],
})
export class CouponModule {}
