import { Controller, Put, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @Request() req,
    @Body() body: { firstname?: string; lastname?: string; phone?: string },
  ) {
    const userId = req.user.userId;
    const user = await this.usersService.update(userId, {
      firstname: body.firstname,
      lastname: body.lastname,
      phone: body.phone,
    });

    return {
      id: user.id,
      email: user.email,
      firstname: user.firstname,
      lastname: user.lastname,
      phone: user.phone,
    };
  }
}
