import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AddressRepository } from '../repository/address.repository';

@Injectable()
export class FindAddressByIdUseCase {
    constructor(
        private readonly addressRepository: AddressRepository,
        private readonly logger: Logger = new Logger(
            FindAddressByIdUseCase.name,
        ),
    ) {}

    async execute(id: string) {
        try {
            const address = await this.addressRepository.findAddressById(id);
            if (!address) {
                const error = new NotFoundException('address not found');
                this.logger.error(error.message);
                throw error;
            }
            this.logger.log('address found', FindAddressByIdUseCase.name);
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
