import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EncryptProvider {
  async encrypt(valueToBeEncrypted: string, saltsOrRounds: string | number): Promise<string> {
    const encryptedValue = await bcrypt.hash(valueToBeEncrypted, saltsOrRounds);
    return encryptedValue;
  }

  async compare(encryptedValue: string, textPlain: string) {
    const checkedValue = await bcrypt.compare(textPlain, encryptedValue);
    return checkedValue;
  }
}
