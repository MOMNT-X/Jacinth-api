import { IsString, IsOptional, IsEnum } from 'class-validator';
import { PaymentProviderEnum } from './initialize-payment.dto';

export class VerifyPaymentDto {
  @IsString()
  reference: string;

  @IsOptional()
  @IsEnum(PaymentProviderEnum)
  provider?: PaymentProviderEnum;
}

