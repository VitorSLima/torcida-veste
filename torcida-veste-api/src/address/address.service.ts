import { Injectable } from '@nestjs/common';
import {
    CreateAddressUseCase,
    DeleteAddressUseCase,
    FindAddressByIdUseCase,
    FindAllAddressesUseCase,
    UpdateAddressUseCase,
} from './use-cases';
import { UpdateAddressInput } from './input/update-address.input';
import { CreateAddressInput } from './input/create-address.input';

@Injectable()
export class AddressService {
    constructor(
        private readonly createAddressUseCase: CreateAddressUseCase,
        private readonly findAllAddressesUseCase: FindAllAddressesUseCase,
        private readonly findAddressByIdUseCase: FindAddressByIdUseCase,
        private readonly updateAddressUseCase: UpdateAddressUseCase,
        private readonly deleteAddressUseCase: DeleteAddressUseCase,
    ) {}

    async createAddress(data: CreateAddressInput) {
        return await this.createAddressUseCase.execute(data);
    }

    async findAllAddresses() {
        return await this.findAllAddressesUseCase.execute();
    }

    async findAddressById(id: string) {
        return await this.findAddressByIdUseCase.execute(id);
    }

    async updateAddress(id: string, data: UpdateAddressInput) {
        return await this.updateAddressUseCase.execute(id, data);
    }

    async deleteAddress(id: string) {
        return await this.deleteAddressUseCase.execute(id);
    }
}
