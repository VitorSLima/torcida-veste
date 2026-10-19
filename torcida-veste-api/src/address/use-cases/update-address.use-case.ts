import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AddressRepository } from '../repository/address.repository';
import { UpdateAddressInput } from '../input/update-address.input';

@Injectable()
export class UpdateAddressUseCase {
    constructor(
        private readonly addressRepository: AddressRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(id: string, data: UpdateAddressInput) {
        try {
            const address = await this.addressRepository.findAddressById(id);
            if (!address) {
                const error = new NotFoundException('Address not found');
                this.logger.error(error.message);
                throw error;
            }
            this.addressRepository.updateAddress(id, data);
            this.logger.log('Address updated', UpdateAddressUseCase.name);
            return address;
        } catch (err) {
            const error = new NotFoundException('Something bad happened', {
                cause: err,
                description: 'Error on updating address',
            });
            this.logger.error(error.message);
            throw error;
        }
    }
}
