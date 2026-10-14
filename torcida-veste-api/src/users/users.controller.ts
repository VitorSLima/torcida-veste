import {
    Body,
    Controller,
    Delete,
    Get,
    Injectable,
    Param,
    Patch,
    Req,
    UseGuards,
    ValidationPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { assertSelfOrAdmin } from './users-access';

@Injectable()
@Controller('user')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Get()
    @Roles('ADMIN')
    findAll() {
        return this.usersService.findAllUsers();
    }

    @Get(':id')
    findOne(@Param('id') id: string, @Req() req) {
        assertSelfOrAdmin(req.user, id);
        return this.usersService.findUserById(id);
    }

    @Patch(':id')
    update(
        @Param('id') id: string,
        @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
        data: UpdateProfileDto,
        @Req() req,
    ) {
        assertSelfOrAdmin(req.user, id);
        return this.usersService.updateUser(id, data);
    }

    @Delete(':id')
    delete(@Param('id') id: string, @Req() req) {
        assertSelfOrAdmin(req.user, id);
        return this.usersService.deleteUser(id);
    }
}
