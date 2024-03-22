import { DISCOUNT_TYPE } from '@prisma/client';

export interface CreateCouponInput {
    code: string;
    value?: number;
    expiration_at?: String;
    discount_type?: DISCOUNT_TYPE
}