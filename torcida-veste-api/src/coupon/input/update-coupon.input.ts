import { DISCOUNT_TYPE } from '@prisma/client';

export interface UpdateCouponInput {
    code?: string | undefined;
    value?: number | undefined;
    expiration_at?: String | undefined;
    discount_type?: DISCOUNT_TYPE | undefined
}