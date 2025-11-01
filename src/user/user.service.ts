import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../common/services/email.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  // Get user profile by ID
  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        countryCode: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // Get user profile by email
  async getUserByEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        countryCode: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // Get all users (Admin only - for future)
  async getAllUsers(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          fullName: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          isVerified: true,
          isActive: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Update user profile
  async updateUser(userId: string, dto: UpdateUserDto) {
    // Check if phone number is already taken
    if (dto.phoneNumber) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          phoneNumber: dto.phoneNumber,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw new ConflictException('Phone number already in use');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        email: true,
        fullName: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        countryCode: true,
        updatedAt: true,
      },
    });

    return {
      message: 'Profile updated successfully',
      user: updatedUser,
    };
  }

  // Change password
  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(dto.newPassword, user.password);
    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Invalidate all sessions except current
    await this.prisma.session.deleteMany({
      where: { userId },
    });

    return {
      message: 'Password changed successfully',
    };
  }

  // Update email (requires verification)
  async requestEmailUpdate(userId: string, dto: UpdateEmailDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password is incorrect');
    }

    // Check if new email is already taken
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.newEmail },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Generate OTP for email verification
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.otp.create({
      data: {
        userId: user.id,
        code: otpCode,
        type: 'EMAIL_VERIFICATION',
        expiresAt,
      },
    });

    // Send OTP to new email
    await this.emailService.sendOtpEmail(dto.newEmail, {
      code: otpCode,
      type: 'email-update',
    });

    return {
      message: 'Verification code sent to new email',
      newEmail: dto.newEmail,
    };
  }

  // Verify new email with OTP
  async verifyEmailUpdate(userId: string, newEmail: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify OTP
    const otp = await this.prisma.otp.findFirst({
      where: {
        userId: user.id,
        code,
        type: 'EMAIL_VERIFICATION',
        isUsed: false,
        expiresAt: { gte: new Date() },
      },
    });

    if (!otp) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Update email
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { email: newEmail },
      select: {
        id: true,
        email: true,
        fullName: true,
        firstName: true,
        lastName: true,
      },
    });

    // Mark OTP as used
    await this.prisma.otp.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });

    return {
      message: 'Email updated successfully',
      user: updatedUser,
    };
  }

  // Deactivate account
  async deactivateAccount(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password is incorrect');
    }

    // Deactivate user
    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    // Delete all sessions
    await this.prisma.session.deleteMany({
      where: { userId },
    });

    return {
      message: 'Account deactivated successfully',
    };
  }

  // Delete account permanently
  async deleteAccount(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password is incorrect');
    }

    // Delete user (cascades to sessions and OTPs)
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return {
      message: 'Account deleted successfully',
    };
  }

  // Get user stats
  async getUserStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        sessions: {
          where: { expiresAt: { gte: new Date() } },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      accountAge: Math.floor(
        (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24),
      ),
      activeSessions: user.sessions.length,
      isVerified: user.isVerified,
      isActive: user.isActive,
      lastUpdated: user.updatedAt,
    };
  }
}
