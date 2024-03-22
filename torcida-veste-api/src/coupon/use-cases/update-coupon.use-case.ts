import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CouponsRepository } from '../repository/coupon.repository';
import { UpdateCouponInput } from '../input/update-coupon.input';

@Injectable()
export class UpdateCouponUseCase {
  constructor(
    private readonly couponsRepository: CouponsRepository,
    private readonly logger: Logger = new Logger(),
  ) {}

  async execute(id: string, data: UpdateCouponInput) {
    try {
      const coupon = await this.couponsRepository.findCouponById(id);
      if (!coupon) {
        const error = new NotFoundException('Coupon not found');
        this.logger.error(error.message);
        throw error;
      }
      this.couponsRepository.updateCoupon(id, data);
      this.logger.log('Coupon updated', UpdateCouponUseCase.name);
      return coupon;
    } catch (err) {
      const error = new NotFoundException('Something bad happened', {
        cause: err,
        description: 'Error on updating coupon',
      });
      this.logger.error(error.message);
      throw error;
    }
  }
}
