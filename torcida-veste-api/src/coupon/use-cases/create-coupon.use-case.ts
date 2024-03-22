import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CreateCouponInput } from '../input/create-coupon.input';
import { CouponsRepository } from '../repository/coupon.repository';

@Injectable()
export class CreateCouponUseCase {
  constructor(
    private readonly couponsRepository: CouponsRepository,
    private readonly logger: Logger = new Logger(),
  ) { }

  async execute(data: CreateCouponInput) {
    try {
      const existingCoupon = await this.couponsRepository.findCouponByCode(
        data.code,
      );

      if (existingCoupon) {
        const error = new BadRequestException('Coupon already exists');
        this.logger.error(error.message);
        throw error;
      }
      const coupon = await this.couponsRepository.createCoupon(data);
      this.logger.log('Coupon created', CreateCouponUseCase.name);
      return coupon;
    } catch (err) {
      if (err.status === 400) {
        this.logger.error('Coupon already exists')
        throw new BadRequestException('O código do cupom já existe')
      } else {
        const error = new ServiceUnavailableException('Something bad happened', {
          cause: err,
          description: 'Error creating coupon',
        });
        this.logger.error(error.message);
        throw error;
      }
    }
  }
}
