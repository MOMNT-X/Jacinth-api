import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaystackService } from './providers/paystack.service';
import { FlutterwaveService } from './providers/flutterwave.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, PaystackService, FlutterwaveService],
  exports: [PaymentsService],
})
export class PaymentsModule {}

