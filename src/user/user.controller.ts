import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateEmailDto } from './dto/update-email.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private usersService: UserService) {}

  // Get current user profile
  @Get('me')
  getCurrentUser(@Request() req) {
    return this.usersService.getUserById(req.user.id);
  }

  // Get user by ID
  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  // Update current user profile
  @Patch('me')
  updateCurrentUser(@Request() req, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(req.user.id, dto);
  }

  // Change password
  @Patch('me/password')
  @HttpCode(HttpStatus.OK)
  changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.id, dto);
  }

  // Request email update
  @Patch('me/email')
  @HttpCode(HttpStatus.OK)
  requestEmailUpdate(@Request() req, @Body() dto: UpdateEmailDto) {
    return this.usersService.requestEmailUpdate(req.user.id, dto);
  }

  // Verify email update
  @Patch('me/email/verify')
  @HttpCode(HttpStatus.OK)
  verifyEmailUpdate(
    @Request() req,
    @Body() body: { newEmail: string; code: string },
  ) {
    return this.usersService.verifyEmailUpdate(
      req.user.id,
      body.newEmail,
      body.code,
    );
  }

  // Get user stats
  @Get('me/stats')
  getUserStats(@Request() req) {
    return this.usersService.getUserStats(req.user.id);
  }

  // Deactivate account
  @Patch('me/deactivate')
  @HttpCode(HttpStatus.OK)
  deactivateAccount(@Request() req, @Body() body: { password: string }) {
    return this.usersService.deactivateAccount(req.user.id, body.password);
  }

  // Delete account permanently
  @Delete('me')
  @HttpCode(HttpStatus.OK)
  deleteAccount(@Request() req, @Body() body: { password: string }) {
    return this.usersService.deleteAccount(req.user.id, body.password);
  }
}
