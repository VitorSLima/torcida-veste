import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { CreateAddressInput } from '../input/create-address.input';
import { AddressRepository } from '../repository/address.repository';

@Injectable()
export class CreateAddressUseCase {
    constructor(
        private readonly addressRepository: AddressRepository,
        private readonly logger: Logger = new Logger(),
    ) {}

    async execute(data: CreateAddressInput) {
        try {
            const address = await this.addressRepository.createAddress(data);
            this.logger.log('Address created', CreateAddressUseCase.name);
            return address;
        } catch (err) {
            const error = new ServiceUnavailableException(
                'Something bad happened',
                {
                    cause: err,
                    description: 'Error creating address',
                },
            );
            this.logger.error(err.message);
            throw error;
        }
    }
}
