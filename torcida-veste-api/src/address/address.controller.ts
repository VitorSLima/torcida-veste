import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
} from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressInput } from './input/update-address.input';
import { AddressService } from './address.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('address')
@UseGuards(JwtAuthGuard)
export class AddressController {
    constructor(private readonly addressService: AddressService) {}

    @Post()
    async create(@Body() data: CreateAddressDto) {
        return await this.addressService.createAddress(data);
    }

    @Get()
    findAll() {
        return this.addressService.findAllAddresses();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.addressService.findAddressById(id);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() data: UpdateAddressInput) {
        return this.addressService.updateAddress(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.addressService.deleteAddress(id);
    }
}
