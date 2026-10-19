import { Body, Controller, Delete, Get, Injectable, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponInput } from './input/update-coupon.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CouponService } from './coupon.service';

@Injectable()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('coupon')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post()
  create(@Body() data: CreateCouponDto) {
    return this.couponService.createCoupon(data);
  }

  @Get(':code')
  findOne(@Param('code') code: string) {
    return this.couponService.findCouponByCode(code);
  }

  @Get()
  findAll() {
    return this.couponService.findAllCoupons();
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: UpdateCouponInput) {
    return this.couponService.updateCoupon(id, data);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.couponService.deleteCoupon(id);
  }
}
