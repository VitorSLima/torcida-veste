import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class GenerateIdProvider {
  generate(): string {
    return crypto.randomUUID();
  }
}
