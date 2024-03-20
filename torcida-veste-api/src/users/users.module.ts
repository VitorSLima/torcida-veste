import { Logger, Module } from '@nestjs/common';
// import { MailModule } from 'src/mail/mail.module';
import { UsersController } from './users.controller';
import { UsersRepository } from './repository/users.repository';
import * as UseCases from './use-cases';
import { UsersService } from './users.service';
import { SharedModule } from '../shared/shared.module';

const usecases = Object.values(UseCases);

@Module({
  imports: [
    SharedModule, 
    // MailModule,
],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository, ...usecases, Logger],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
