import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/databases/prisma.database';
import { CreateAddressInput } from '../input/create-address.input';
import { UpdateAddressInput } from '../input/update-address.input';

@Injectable()
export class AddressRepository {
    constructor(private readonly prisma: PrismaService) {}

    async createAddress(data: CreateAddressInput) {
        try {
            const address = await this.prisma.address.create({
                data: {
                    ...data,
                    zipCode: data.zipCode,
                    street: data.street,
                    number: data.number,
                    complement: data.complement,
                    neighborhood: data.neighborhood,
                    city: data.city,
                    state: data.state,
                },
            });
            return address;
        } catch (error) {
            console.error(error);
        }
    }

    async findAllAddresses() {
        try {
            const addresses = this.prisma.address.findMany();
            return addresses;
        } catch (error) {
            console.error(error);
        }
    }

    async findAddressById(id: string) {
        try {
            const address = this.prisma.address.findUnique({
                where: {
                    id,
                },
            });
            return address;
        } catch (error) {
            console.error(error);
        }
    }

    async updateAddress(id: string, data: UpdateAddressInput) {
        try {
            const address = this.prisma.address.update({
                where: {
                    id,
                },
                data: {
                    ...data,
                    zipCode: data.zipCode,
                    street: data.street,
                    number: data.number,
                    complement: data.complement,
                    neighborhood: data.neighborhood,
                    city: data.city,
                    state: data.state,
                },
            });
            return address;
        } catch (error) {
            console.error(error);
        }
    }

    async deleteAddress(id: string) {
        try {
            const address = this.prisma.address.delete({
                where: {
                    id,
                },
            });
            return address;
        } catch (error) {
            console.error(error);
        }
    }
}
