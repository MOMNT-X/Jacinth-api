import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/services/email.service';
import { DiscordService } from '../common/services/discord.service';
import * as bcrypt from 'bcrypt';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ResetPasswordConfirmDto } from './dto/reset-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SetupAccountDto } from './dto/setup-account.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private discordService: DiscordService,
  ) {}

  private generateOtp(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  // Compare password
  private async comparePassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Send OTP via email using Resend
  private async sendOtpEmail(
    email: string,
    code: string,
    type: 'verification' | 'reset' | 'email-update',
  ): Promise<void> {
    await this.emailService.sendOtpEmail(email, {
      code,
      type:
        type === 'email-update'
          ? 'email-update'
          : type === 'reset'
            ? 'reset'
            : 'verification',
    });
  }

  // 1. SIGNUP - Create user and send OTP
  async signup(dto: SignupDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser && existingUser.isVerified) {
      throw new ConflictException('User already exists');
    }

    // Create or update user
    const user = await this.prisma.user.upsert({
      where: { email: dto.email },
      update: { fullName: dto.fullName },
      create: {
        email: dto.email,
        fullName: dto.fullName,
        password: await this.hashPassword('TEMP_PASSWORD'), // Temporary
      },
    });

    // Generate OTP
    const otpCode = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.otp.create({
      data: {
        userId: user.id,
        code: otpCode,
        type: 'EMAIL_VERIFICATION',
        expiresAt,
      },
    });

    // Send OTP email
    await this.sendOtpEmail(dto.email, otpCode, 'verification');

    return {
      message: 'OTP sent to your email',
      email: dto.email,
    };
  }

  // 2. VERIFY OTP
  async verifyOtp(dto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const otp = await this.prisma.otp.findFirst({
      where: {
        userId: user.id,
        code: dto.code,
        type: 'EMAIL_VERIFICATION',
        isUsed: false,
        expiresAt: { gte: new Date() },
      },
    });

    if (!otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Mark OTP as used
    await this.prisma.otp.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });

    // Send Discord notification if user is being verified for the first time
    if (!user.isVerified) {
      // User will be verified in setupAccount, so we'll notify there
      // But we can send a notification here too
      this.discordService
        .notifyUserSignup({
          email: user.email,
          fullName: user.fullName,
          userId: user.id,
        })
        .catch(() => {
          // Fail silently - don't block the flow
        });
    }

    return {
      message: 'OTP verified successfully',
      userId: user.id,
      email: user.email,
    };
  }

  // 3. SETUP ACCOUNT - Complete profile
  async setupAccount(email: string, dto: SetupAccountDto) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.isVerified) {
      throw new BadRequestException('Account already set up');
    }

    // Check if phone number is already taken
    if (dto.phoneNumber) {
      const existingPhone = await this.prisma.user.findUnique({
        where: { phoneNumber: dto.phoneNumber },
      });

      if (existingPhone && existingPhone.id !== user.id) {
        throw new ConflictException('Phone number already in use');
      }
    }

    // Update user with complete details
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phoneNumber,
        countryCode: dto.countryCode,
        password: await this.hashPassword(dto.password),
        isVerified: true,
      },
    });

    // Generate JWT token
    const token = this.jwtService.sign({
      sub: updatedUser.id,
      email: updatedUser.email,
    });

    // Create session
    await this.prisma.session.create({
      data: {
        userId: updatedUser.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Send Discord notification for new user signup
    this.discordService
      .notifyUserSignup({
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        userId: updatedUser.id,
      })
      .catch(() => {
        // Fail silently - don't block the flow
      });

    return {
      message: 'Account setup successful',
      access_token: token,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
      },
    };
  }

  // 4. LOGIN
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.isVerified) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.comparePassword(
      dto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
    });

    // Create session
    await this.prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      message: 'Login successful',
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  // 5. RESET PASSWORD - Send OTP
  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      // Don't reveal if user exists
      return { message: 'If the email exists, an OTP has been sent' };
    }

    // Generate OTP
    const otpCode = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.otp.create({
      data: {
        userId: user.id,
        code: otpCode,
        type: 'PASSWORD_RESET',
        expiresAt,
      },
    });

    await this.sendOtpEmail(dto.email, otpCode, 'reset');

    return { message: 'If the email exists, an OTP has been sent' };
  }

  // 6. RESET PASSWORD - Confirm with OTP
  async resetPasswordConfirm(dto: ResetPasswordConfirmDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException('Invalid request');
    }

    const otp = await this.prisma.otp.findFirst({
      where: {
        userId: user.id,
        code: dto.code,
        type: 'PASSWORD_RESET',
        isUsed: false,
        expiresAt: { gte: new Date() },
      },
    });

    if (!otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Update password
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: await this.hashPassword(dto.newPassword) },
    });

    // Mark OTP as used
    await this.prisma.otp.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });

    // Invalidate all sessions
    await this.prisma.session.deleteMany({
      where: { userId: user.id },
    });

    return { message: 'Password reset successful' };
  }
}
