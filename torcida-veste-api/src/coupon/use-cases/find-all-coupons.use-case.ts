import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CouponsRepository } from '../repository/coupon.repository';

@Injectable()
export class FindAllCouponUseCase {
  constructor(
    private readonly couponsRepository: CouponsRepository,
    private readonly logger: Logger = new Logger(FindAllCouponUseCase.name),
  ) {}

  async execute() {
    const coupon = await this.couponsRepository.findAllCoupons();

    if (!coupon) {
      const error = new NotFoundException('Coupon not found');
      this.logger.error(error.message);
      throw error;
    }
    this.logger.log('Coupon found', FindAllCouponUseCase.name);
    return coupon;
  }
}
