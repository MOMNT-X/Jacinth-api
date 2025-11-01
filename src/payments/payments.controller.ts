import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
  Param,
  Get,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('initialize')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  initializePayment(@Request() req, @Body() dto: InitializePaymentDto) {
    return this.paymentsService.initializePayment(req.user.id, dto);
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  verifyPayment(@Request() req, @Body() dto: VerifyPaymentDto) {
    return this.paymentsService.verifyPayment(req.user.id, dto);
  }

  @Post('webhook/paystack')
  @HttpCode(HttpStatus.OK)
  paystackWebhook(@Body() body: any, @Headers('x-paystack-signature') signature: string) {
    return this.paymentsService.handleWebhook('PAYSTACK', body, signature);
  }

  @Post('webhook/flutterwave')
  @HttpCode(HttpStatus.OK)
  flutterwaveWebhook(@Body() body: any, @Headers('verif-hash') signature: string) {
    return this.paymentsService.handleWebhook('FLUTTERWAVE', body, signature);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  getUserTransactions(@Request() req) {
    // This can be implemented to get user's transaction history
    return { message: 'Feature coming soon' };
  }
}

