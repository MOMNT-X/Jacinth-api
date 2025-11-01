import { IsEnum, IsNumber, IsString, IsOptional, IsUUID, Min, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentProviderEnum {
  PAYSTACK = 'PAYSTACK',
  FLUTTERWAVE = 'FLUTTERWAVE',
  PAYPAL = 'PAYPAL',
}

export class InitializePaymentDto {
  @IsUUID()
  orderId: string;

  @IsEnum(PaymentProviderEnum)
  provider: PaymentProviderEnum;

  @IsOptional()
  @IsString()
  callbackUrl?: string;
}

