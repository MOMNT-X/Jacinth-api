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
  Query,
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
  getUserTransactions(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.paymentsService.getUserTransactions(req.user.id, pageNum, limitNum);
  }
}

