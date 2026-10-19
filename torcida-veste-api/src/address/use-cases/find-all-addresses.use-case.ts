import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AddressRepository } from '../repository/address.repository';

@Injectable()
export class FindAllAddressesUseCase {
    constructor(
        private readonly addressRepository: AddressRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute() {
        try {
            const address =
                await this.addressRepository.findAllAddresses();

            if (!address) {
                const error = new NotFoundException('Address not found');
                this.logger.error(error.message);
                throw error;
            }
            this.logger.log('Address found', FindAllAddressesUseCase.name);
            return {
                address,
            };
        } catch (err) {
            const error = new NotFoundException('Something bad happened', {
                cause: err,
                description: 'Error on find address',
            });
            this.logger.error(error.message);
            throw error;
        }
    }
}
