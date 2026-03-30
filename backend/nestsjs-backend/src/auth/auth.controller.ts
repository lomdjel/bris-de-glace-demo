import { Controller, Post, Body, Get, Query, UseGuards, Request, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestResetPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('verify')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  async resendVerification(@Body() body: { email: string }) {
    return this.authService.resendVerification(body.email);
  }

  @Post('request-reset-password')
  async requestResetPassword(@Body() dto: RequestResetPasswordDto) {
    return this.authService.requestResetPassword(dto);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  async changePassword(@Request() req, @Body() body: { currentPassword: string; newPassword: string }) {
    return this.authService.changePassword(req.user.userId, body);
  }

  @Get('validate-invitation')
  async validateInvitation(@Query('token') token: string) {
    return this.authService.validateInvitationToken(token);
  }

  @Post('magic-link')
  async requestMagicLink(@Body('email') email: string) {
    if (!email) {
      throw new BadRequestException('L\'email est requis');
    }
    return this.authService.sendMagicLink(email);
  }

  @Get('magic-verify')
  async verifyMagicLink(@Query('token') token: string) {
    if (!token) {
      throw new BadRequestException('Le token est requis');
    }
    return this.authService.verifyMagicLink(token);
  }

  @Post('register-artisan')
  async registerArtisan(@Body() body: {
    token: string;
    email: string;
    password: string;
    firstname: string;
    lastname: string;
    phone?: string;
    companyName: string;
    siret?: string;
  }) {
    return this.authService.registerArtisan(body);
  }
}
