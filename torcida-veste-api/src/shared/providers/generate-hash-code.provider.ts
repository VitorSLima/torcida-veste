import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class GenerateHashCodeProvider {
  generate(size: number): string {
    size = Math.floor(size);

    if (size < 1) {
      throw new InternalServerErrorException('Invalid hash code size');
    }

    return crypto.randomBytes(size).toString('hex');
  }
}
