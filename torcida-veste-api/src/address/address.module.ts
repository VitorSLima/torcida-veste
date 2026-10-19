import { Logger, Module } from '@nestjs/common';
import * as UseCases from './use-cases';
import { AddressController } from './address.controller';
import { AddressService } from './address.service';
import { AddressRepository } from './repository/address.repository';

const usecases = Object.values(UseCases);
@Module({
    imports: [],
    controllers: [AddressController],
    providers: [AddressService, AddressRepository, ...usecases, Logger],
    exports: [AddressService, AddressRepository],
})
export class AddressModule {}
