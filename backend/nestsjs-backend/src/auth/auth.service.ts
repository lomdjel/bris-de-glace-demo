import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RequestResetPasswordDto, ResetPasswordDto } from './dto/reset-password.dto';
import { JwtPayload, HasuraClaims } from '../common/interfaces/jwt-payload.interface';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { ArtisanInvitation } from '../entities/artisan-invitation.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
    @InjectRepository(ArtisanInvitation)
    private readonly invitationRepository: Repository<ArtisanInvitation>,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified && user.role.name !== 'admin') {
      throw new UnauthorizedException('Account not verified');
    }

    const token = this.generateToken(user);

    return {
      token,
      user: {
        id: user.id,
        uid: user.uid,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role.name,
        phone: user.phone,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    if (registerDto.siret && registerDto.siret.length > 14) {
      throw new BadRequestException('Le SIRET doit contenir au maximum 14 caractères');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    // Artisan registration flow
    if (registerDto.role === 'artisan') {
      const artisanRole = await this.usersService.getRoleByName('artisan');
      const roleId = artisanRole ? artisanRole.id : 3;
      const verificationToken = randomUUID();

      const user = await this.usersService.create({
        email: registerDto.email,
        password: hashedPassword,
        firstname: registerDto.firstname || '',
        lastname: registerDto.lastname || '',
        phone: registerDto.phone,
        uid: randomUUID(),
        verification_token: verificationToken,
        is_verified: false,
        role_id: roleId,
      });

      // Create artisan profile + free trial subscription
      await this.usersService.createArtisanProfile(user.id, {
        companyName: registerDto.companyName || (registerDto.firstname || '') + ' ' + (registerDto.lastname || ''),
        siret: registerDto.siret,
      });

      // Send verification email
      await this.mailService.sendVerificationEmail(user.email, verificationToken);

      return {
        message: 'Inscription r\u00e9ussie. Veuillez v\u00e9rifier votre email pour activer votre compte.',
        user: {
          id: user.id,
          email: user.email,
          firstname: user.firstname,
          lastname: user.lastname,
        },
      };
    }

    // Default user registration flow
    const verificationToken = randomUUID();

    const user = await this.usersService.create({
      email: registerDto.email,
      password: hashedPassword,
      firstname: registerDto.firstname || '',
      lastname: registerDto.lastname || '',
      phone: registerDto.phone,
      uid: randomUUID(),
      verification_token: verificationToken,
      is_verified: false,
      role_id: 2, // Default role: user
    });

    // Send verification email
    await this.mailService.sendVerificationEmail(user.email, verificationToken);

    return {
      message: 'Registration successful. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        firstname: user.firstname,
        lastname: user.lastname,
      },
    };
  }

  async verifyEmail(token: string) {
    const user = await this.usersService.findByVerificationToken(token);

    if (!user) {
      throw new UnauthorizedException('Invalid verification token');
    }

    await this.usersService.update(user.id, {
      is_verified: true,
      verification_token: null,
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerification(email: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return { message: 'Si ce compte existe, un email de vérification a été envoyé.' };
    }

    if (user.isVerified) {
      return { message: 'Ce compte est déjà vérifié.' };
    }

    const verificationToken = randomUUID();
    await this.usersService.update(user.id, { verification_token: verificationToken });
    await this.mailService.sendVerificationEmail(user.email, verificationToken);

    return { message: 'Email de vérification envoyé.' };
  }

  async requestResetPassword(dto: RequestResetPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      // Don't reveal if email exists
      return { message: 'If the email exists, a reset link has been sent.' };
    }

    const resetToken = randomUUID();
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

    await this.usersService.update(user.id, {
      reset_token: resetToken,
      reset_token_expires: resetTokenExpires,
    });

    await this.mailService.sendResetPasswordEmail(user.email, resetToken);

    return { message: 'If the email exists, a reset link has been sent.' };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersService.findByResetToken(dto.token);

    if (!user || new Date() > user.resetTokenExpires) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);

    await this.usersService.update(user.id, {
      password: hashedPassword,
      reset_token: null,
      reset_token_expires: null,
    });

    return { message: 'Password reset successfully' };
  }

  async validateInvitationToken(token: string) {
    const invitation = await this.invitationRepository.findOne({ where: { token } });

    if (!invitation) {
      throw new BadRequestException('Token d\'invitation invalide');
    }
    if (invitation.isUsed) {
      throw new BadRequestException('Cette invitation a déjà été utilisée');
    }
    if (new Date() > invitation.expiresAt) {
      throw new BadRequestException('Cette invitation a expiré');
    }

    return { valid: true, email: invitation.email };
  }

  async registerArtisan(data: {
    token: string;
    email: string;
    password: string;
    firstname: string;
    lastname: string;
    phone?: string;
    companyName: string;
    siret?: string;
  }) {
    // Validate invitation token
    const invitation = await this.invitationRepository.findOne({
      where: { token: data.token },
    });

    if (!invitation || invitation.isUsed || new Date() > invitation.expiresAt) {
      throw new BadRequestException('Token d\'invitation invalide ou expiré');
    }

    if (invitation.email !== data.email) {
      throw new BadRequestException('L\'email ne correspond pas à l\'invitation');
    }

    // Check email not taken
    const existingUser = await this.usersService.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictException('Un compte avec cet email existe déjà');
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user with artisan role (id=3)
    const artisanRole = await this.usersService.getRoleByName('artisan');
    const roleId = artisanRole ? artisanRole.id : 3;

    const user = await this.usersService.create({
      email: data.email,
      password: hashedPassword,
      firstname: data.firstname,
      lastname: data.lastname,
      phone: data.phone,
      uid: randomUUID(),
      is_verified: true,
      role_id: roleId,
    });

    // Create artisan profile + free trial subscription
    await this.usersService.createArtisanProfile(user.id, {
      companyName: data.companyName,
      siret: data.siret,
    });

    // Mark invitation as used
    invitation.isUsed = true;
    await this.invitationRepository.save(invitation);

    // Fetch complete user with relations for token generation
    const fullUser = await this.usersService.findById(user.id);
    if (!fullUser) {
      throw new BadRequestException('Erreur lors de la creation du compte');
    }
    const token = this.generateToken(fullUser);

    return {
      token,
      user: {
        id: fullUser.id,
        uid: fullUser.uid,
        email: fullUser.email,
        firstname: fullUser.firstname,
        lastname: fullUser.lastname,
        role: fullUser.role.name,
        phone: fullUser.phone,
      },
    };
  }

  async sendMagicLink(email: string): Promise<{ message: string }> {
    const token = this.jwtService.sign(
      { email, type: 'magic_link' },
      { expiresIn: '24h' },
    );
    await this.mailService.sendMagicLinkEmail(email, token);
    return { message: 'Lien de suivi envoyé par email' };
  }

  async verifyMagicLink(token: string): Promise<{ token: string; email: string }> {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'magic_link') {
        throw new BadRequestException('Token invalide');
      }
      const sessionToken = this.jwtService.sign(
        { email: payload.email, type: 'guest_session' },
        { expiresIn: '7d' },
      );
      return { token: sessionToken, email: payload.email };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Lien expiré ou invalide');
    }
  }

  async changePassword(userId: number, data: { currentPassword: string; newPassword: string }) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    const isPasswordValid = await bcrypt.compare(data.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }

    const hashedPassword = await bcrypt.hash(data.newPassword, 12);
    await this.usersService.update(user.id, { password: hashedPassword });

    return { message: 'Mot de passe modifié avec succès' };
  }

  private generateToken(user: any): string {
    const hasuraClaims: HasuraClaims = {
      'x-hasura-allowed-roles': [user.role.name],
      'x-hasura-default-role': user.role.name,
      'x-hasura-user-id': user.uid,
    };

    // Add artisan ID if user is an artisan
    if (user.artisan) {
      hasuraClaims['x-hasura-artisan-id'] = user.artisan.id.toString();
    }

    const payload: JwtPayload = {
      sub: user.uid,
      userId: user.id,
      email: user.email,
      'https://hasura.io/jwt/claims': hasuraClaims,
    };

    return this.jwtService.sign(payload);
  }
}
