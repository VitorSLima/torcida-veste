import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AddressRepository } from '../repository/address.repository';

@Injectable()
export class DeleteAddressUseCase {
    constructor(
        private readonly addressRepository: AddressRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(id: string) {
        const address = this.addressRepository.findAddressById(id);
        if (!address) {
            const error = new NotFoundException('Address not found');
            this.logger.error(error.message);
            throw error;
        }

        try {
            this.addressRepository.deleteAddress(id);
            this.logger.log('Address deleted', DeleteAddressUseCase.name);
            return address;
        } catch (err) {
            const error = new NotFoundException('Something bad happened', {
                cause: err,
                description: 'Error on deleting address',
            });
            this.logger.error(error.message);
            throw error;
        }
    }
}
