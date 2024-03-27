import {
    Body,
    Controller,
    Delete,
    Get,
    Injectable,
    Param,
    Patch,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateUserInput } from './inputs/update-user.input';

@Injectable()
@Controller('user')
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) {}


    @Get()
    findAll() {
        return this.usersService.findAllUsers();
    }
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.usersService.findUserById(id);
    }
      @Get(':email')
    findByEmail(@Param('id') id: string) {
        return this.usersService.findUserByEmail(id);
    }
    @Patch(':id')
    update(@Param('id') id: string, @Body() data: UpdateUserInput) {
        return this.usersService.updateUser(id, data);
    }
    @Delete(':id')
    delete(@Param('id') id: string) {
        return this.usersService.deleteUser(id);
    }
}
