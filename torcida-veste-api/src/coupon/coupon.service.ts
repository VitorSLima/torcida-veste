import { Injectable } from '@nestjs/common';
import {
  FindAllCouponUseCase,
  FindCouponByCodeUseCase,
  UpdateCouponUseCase,
  DeleteCouponUseCase,
  CreateCouponUseCase,
} from './use-cases';
import { CreateCouponInput } from './input/create-coupon.input';
import { UpdateCouponInput } from './input/update-coupon.input';

@Injectable()
export class CouponService {
  constructor(
    private readonly findAllCouponUseCase: FindAllCouponUseCase,
    private readonly findCouponByCodeUseCase: FindCouponByCodeUseCase,
    private readonly updateCouponUseCase: UpdateCouponUseCase,
    private readonly deleteCouponUseCase: DeleteCouponUseCase,
    private readonly createCouponUseCase: CreateCouponUseCase,
  ) { }

  async createCoupon(data: CreateCouponInput) {
    return await this.createCouponUseCase.execute(data);
  }

  async findAllCoupons() {
    return await this.findAllCouponUseCase.execute();
  }

  async findCouponByCode(code: string) {
    return await this.findCouponByCodeUseCase.execute(code);
  }

  async updateCoupon(id: string, data: UpdateCouponInput) {
    return await this.updateCouponUseCase.execute(id, data);
  }

  async deleteCoupon(id: string) {
    return await this.deleteCouponUseCase.execute(id);
  }
}
