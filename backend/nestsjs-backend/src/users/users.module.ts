import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User, Role, Artisan, Subscription, Formule } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([User, Role, Artisan, Subscription, Formule])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
