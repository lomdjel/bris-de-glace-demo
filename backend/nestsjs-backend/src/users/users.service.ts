import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { User, Role, Artisan } from '../entities';
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';
import { Formule } from '../entities/formule.entity';

interface CreateUserData {
  uid: string;
  email: string;
  password: string;
  firstname: string;
  lastname: string;
  phone?: string;
  role_id: number;
  is_verified: boolean;
  verification_token?: string;
}

interface UpdateUserData {
  firstname?: string;
  lastname?: string;
  phone?: string;
  password?: string;
  is_verified?: boolean;
  verification_token?: string | null;
  reset_token?: string | null;
  reset_token_expires?: Date | null;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(Artisan)
    private readonly artisanRepository: Repository<Artisan>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepository: Repository<Subscription>,
    @InjectRepository(Formule)
    private readonly formuleRepository: Repository<Formule>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: ['role', 'artisan'],
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['role', 'artisan'],
    });
  }

  async findByUid(uid: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { uid },
      relations: ['role', 'artisan'],
    });
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { verificationToken: token },
      relations: ['role'],
    });
  }

  async findByResetToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { resetToken: token },
      relations: ['role'],
    });
  }

  async create(userData: CreateUserData): Promise<User> {
    const user = this.userRepository.create({
      uid: userData.uid,
      email: userData.email,
      password: userData.password,
      firstname: userData.firstname,
      lastname: userData.lastname,
      phone: userData.phone,
      roleId: userData.role_id,
      isVerified: userData.is_verified,
      verificationToken: userData.verification_token,
    });

    return this.userRepository.save(user);
  }

  async update(id: number, data: UpdateUserData): Promise<User> {
    const updateData: Partial<User> = {};

    if (data.firstname !== undefined) updateData.firstname = data.firstname;
    if (data.lastname !== undefined) updateData.lastname = data.lastname;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.password !== undefined) updateData.password = data.password;
    if (data.is_verified !== undefined) updateData.isVerified = data.is_verified;
    if (data.verification_token !== undefined) updateData.verificationToken = data.verification_token as any;
    if (data.reset_token !== undefined) updateData.resetToken = data.reset_token as any;
    if (data.reset_token_expires !== undefined) updateData.resetTokenExpires = data.reset_token_expires as any;

    await this.userRepository.update(id, updateData);
    return (await this.findById(id))!;
  }

  async getRoleByName(name: string): Promise<Role | null> {
    return this.roleRepository.findOne({ where: { name } });
  }

  async getUserRole(userId: number): Promise<string> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['role'],
    });
    return user?.role?.name || 'user';
  }

  async createArtisanProfile(userId: number, data: Partial<Artisan>): Promise<Artisan> {
    const isProduction = process.env.NODE_ENV === 'production';
    const artisan = this.artisanRepository.create({
      userId,
      ...data,
      ...(!isProduction && { stripeOnboardingComplete: true }),
    });
    const savedArtisan = await this.artisanRepository.save(artisan);

    // Auto-assign Essai Gratuit subscription
    const freeTrialPlan = await this.formuleRepository.findOne({
      where: { name: ILike('essai gratuit'), isActive: true },
    });
    if (freeTrialPlan) {
      const now = new Date();
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + 60);
      const subscription = this.subscriptionRepository.create({
        artisanId: savedArtisan.id,
        planId: freeTrialPlan.id,
        status: SubscriptionStatus.ACTIVE,
        pricePaid: 0,
        startDate: now,
        endDate,
        autoRenew: false,
      });
      await this.subscriptionRepository.save(subscription);
    }

    return savedArtisan;
  }

  async getArtisanByUserId(userId: number): Promise<Artisan | null> {
    return this.artisanRepository.findOne({
      where: { userId },
      relations: ['user'],
    });
  }
}
