import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CouponsRepository } from '../repository/coupon.repository';

@Injectable()
export class DeleteCouponUseCase {
  constructor(
    private readonly couponsRepository: CouponsRepository,
    private readonly logger: Logger = new Logger(),
  ) {}

  async execute(id: string) {
    const coupon = this.couponsRepository.findCouponById(id);
    if (!coupon) {
      const error = new NotFoundException('Coupon not found');
      this.logger.error(error.message);
      throw error;
    }

    try {
      this.couponsRepository.deleteCoupon(id);
      this.logger.log('Coupon deleted', DeleteCouponUseCase.name);
    } catch (err) {
      const error = new NotFoundException('Something bad happened', {
        cause: err,
        description: 'Error on deleting coupon',
      });
      this.logger.error(error.message);
      throw error;
    }
  }
}
