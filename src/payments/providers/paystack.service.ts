import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import {
  PaymentProvider,
  InitializePaymentDto,
  InitializePaymentResponse,
  VerifyPaymentResponse,
} from '../interfaces/payment-provider.interface';
import * as crypto from 'crypto';

@Injectable()
export class PaystackService implements PaymentProvider {
  private readonly logger = new Logger(PaystackService.name);
  private readonly secretKey: string;
  private readonly publicKey: string;
  private readonly baseUrl = 'https://api.paystack.co';

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY || '';
    this.publicKey = process.env.PAYSTACK_PUBLIC_KEY || '';

    if (!this.secretKey || !this.publicKey) {
      this.logger.warn('Paystack credentials not configured');
    }
  }

  async initializePayment(data: InitializePaymentDto): Promise<InitializePaymentResponse> {
    try {
      const reference = data.reference || `ref_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        {
          email: data.email,
          amount: Math.round(data.amount * 100), // Convert to kobo (smallest currency unit)
          currency: data.currency.toUpperCase() || 'NGN',
          reference,
          callback_url: data.callbackUrl,
          metadata: data.metadata || {},
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data.status) {
        return {
          authorizationUrl: response.data.data.authorization_url,
          reference: response.data.data.reference,
          accessCode: response.data.data.access_code,
          provider: 'PAYSTACK',
          metadata: response.data.data,
        };
      }

      throw new BadRequestException('Failed to initialize Paystack payment');
    } catch (error: any) {
      this.logger.error('Paystack initialize payment error:', error.response?.data || error.message);
      throw new BadRequestException(
        error.response?.data?.message || 'Failed to initialize payment with Paystack',
      );
    }
  }

  async verifyPayment(reference: string): Promise<VerifyPaymentResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/transaction/verify/${reference}`, {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      });

      if (response.data.status && response.data.data) {
        const transaction = response.data.data;
        const status = transaction.status === 'success' ? 'success' : 
                       transaction.status === 'failed' ? 'failed' : 'pending';

        return {
          status,
          reference: transaction.reference,
          amount: transaction.amount / 100, // Convert from kobo
          currency: transaction.currency,
          metadata: transaction,
          providerResponse: response.data,
        };
      }

      return {
        status: 'failed',
        reference,
        amount: 0,
        currency: 'NGN',
        providerResponse: response.data,
      };
    } catch (error: any) {
      this.logger.error('Paystack verify payment error:', error.response?.data || error.message);
      throw new BadRequestException(
        error.response?.data?.message || 'Failed to verify payment with Paystack',
      );
    }
  }

  verifyWebhook(body: any, signature: string): boolean {
    try {
      const hash = crypto
        .createHmac('sha512', this.secretKey)
        .update(JSON.stringify(body))
        .digest('hex');

      return hash === signature;
    } catch (error) {
      this.logger.error('Paystack webhook verification error:', error);
      return false;
    }
  }

  async handleWebhook(body: any): Promise<VerifyPaymentResponse> {
    const event = body.event;
    const data = body.data;

    if (event === 'charge.success') {
      return {
        status: 'success',
        reference: data.reference,
        amount: data.amount / 100,
        currency: data.currency,
        metadata: data,
        providerResponse: body,
      };
    }

    if (event === 'charge.failed') {
      return {
        status: 'failed',
        reference: data.reference,
        amount: data.amount / 100,
        currency: data.currency,
        metadata: data,
        providerResponse: body,
      };
    }

    // Default to pending for other events
    return {
      status: 'pending',
      reference: data.reference || '',
      amount: data.amount ? data.amount / 100 : 0,
      currency: data.currency || 'NGN',
      metadata: data,
      providerResponse: body,
    };
  }
}

