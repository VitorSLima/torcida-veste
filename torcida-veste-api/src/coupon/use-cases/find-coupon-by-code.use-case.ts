import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CouponsRepository } from '../repository/coupon.repository';

@Injectable()
export class FindCouponByCodeUseCase {
  constructor(
    private readonly couponsRepository: CouponsRepository,
    private readonly logger: Logger = new Logger(FindCouponByCodeUseCase.name),
  ) { }

  async execute(code: string) {
    const coupon = await this.couponsRepository.findCouponByCode(code);

    if (!coupon) {
      const error = new NotFoundException('Coupon not found');
      this.logger.error(error.message);
      throw error;
    }
    this.logger.log('Coupon found', FindCouponByCodeUseCase.name);
    return coupon;
  }
}
