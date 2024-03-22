import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/databases/prisma.database';
import { CreateCouponInput } from '../input/create-coupon.input';
import { UpdateCouponInput } from '../input/update-coupon.input';

@Injectable()
export class CouponsRepository {
  constructor(private readonly prisma: PrismaService) { }

  async createCoupon(data: CreateCouponInput) {
    try {
        const coupon = await this.prisma.coupon.create({
            data: {
                    ...data,
                    code: data.code,
                    value: data.value,
                    discount_type: data.discount_type,
                    expiration_at: data.expiration_at as string,
            },
        });
        return coupon;
    } catch (error) {
        console.error(error);
    }
  }

  async findAllCoupons() {
    try {
      const coupons = await this.prisma.coupon.findMany();
      return coupons;
    } catch (error) {
      console.error(error);
    }
  }


  async findCouponById(id: string) {
    try {
      const coupon = await this.prisma.category.findFirst({
        where: {
          id: {
            equals: id,
          }
        },
      });
      return coupon;
    } catch (error) {
      console.error(error);
    }
  }

  async findCouponByCode(code: string) {
    try {
      const coupon = await this.prisma.coupon.findFirst({
        where: {
          code: {
            equals: code,
          }
        },
      });
      return coupon;
    } catch (error) {
      console.error(error);
    }
  }

  async updateCoupon(id: string, data: UpdateCouponInput) {
    try {
      const coupon = await this.prisma.coupon.update({
        where: {
          id,
        },
        data: {
          code: data.code,
          value: data.value,
          discount_type: data.discount_type,
          expiration_at: data.expiration_at as string,
        },
      });
      return coupon;
    } catch (error) {
      console.error(error);
    }
  }

  async deleteCoupon(id: string) {
    const coupon = await this.prisma.coupon.delete({
      where: {
        id,
      },
    });
    return coupon;
  }
}
