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
export class FlutterwaveService implements PaymentProvider {
  private readonly logger = new Logger(FlutterwaveService.name);
  private readonly secretKey: string;
  private readonly publicKey: string;
  private readonly baseUrl = 'https://api.flutterwave.com/v3';

  constructor() {
    this.secretKey = process.env.FLUTTERWAVE_SECRET_KEY || '';
    this.publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY || '';

    if (!this.secretKey || !this.publicKey) {
      this.logger.warn('Flutterwave credentials not configured');
    }
  }

  async initializePayment(data: InitializePaymentDto): Promise<InitializePaymentResponse> {
    try {
      const reference = data.reference || `FLW_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const response = await axios.post(
        `${this.baseUrl}/payments`,
        {
          tx_ref: reference,
          amount: data.amount,
          currency: data.currency.toUpperCase() || 'NGN',
          redirect_url: data.callbackUrl,
          payment_options: 'card, banktransfer, ussd',
          customer: {
            email: data.email,
          },
          meta: data.metadata || {},
          customizations: {
            title: 'Jacinth Pharmacy',
            description: 'Order Payment',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.data.status === 'success') {
        return {
          authorizationUrl: response.data.data.link,
          reference: response.data.data.tx_ref,
          provider: 'FLUTTERWAVE',
          metadata: response.data.data,
        };
      }

      throw new BadRequestException('Failed to initialize Flutterwave payment');
    } catch (error: any) {
      this.logger.error('Flutterwave initialize payment error:', error.response?.data || error.message);
      throw new BadRequestException(
        error.response?.data?.message || 'Failed to initialize payment with Flutterwave',
      );
    }
  }

  async verifyPayment(reference: string): Promise<VerifyPaymentResponse> {
    try {
      const response = await axios.get(`${this.baseUrl}/transactions/verify_by_reference?tx_ref=${reference}`, {
        headers: {
          Authorization: `Bearer ${this.secretKey}`,
        },
      });

      if (response.data.status === 'success' && response.data.data) {
        const transaction = response.data.data;
        const status = transaction.status === 'successful' ? 'success' : 
                       transaction.status === 'failed' ? 'failed' : 'pending';

        return {
          status,
          reference: transaction.tx_ref,
          amount: parseFloat(transaction.amount),
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
      this.logger.error('Flutterwave verify payment error:', error.response?.data || error.message);
      throw new BadRequestException(
        error.response?.data?.message || 'Failed to verify payment with Flutterwave',
      );
    }
  }

  verifyWebhook(body: any, signature: string): boolean {
    try {
      const hash = crypto
        .createHmac('sha256', this.secretKey)
        .update(JSON.stringify(body))
        .digest('hex');

      return hash === signature;
    } catch (error) {
      this.logger.error('Flutterwave webhook verification error:', error);
      return false;
    }
  }

  async handleWebhook(body: any): Promise<VerifyPaymentResponse> {
    const data = body.data;

    if (body.event === 'charge.completed' && data.status === 'successful') {
      return {
        status: 'success',
        reference: data.tx_ref,
        amount: parseFloat(data.amount),
        currency: data.currency,
        metadata: data,
        providerResponse: body,
      };
    }

    if (body.event === 'charge.completed' && data.status === 'failed') {
      return {
        status: 'failed',
        reference: data.tx_ref,
        amount: parseFloat(data.amount || '0'),
        currency: data.currency || 'NGN',
        metadata: data,
        providerResponse: body,
      };
    }

    return {
      status: 'pending',
      reference: data?.tx_ref || '',
      amount: parseFloat(data?.amount || '0'),
      currency: data?.currency || 'NGN',
      metadata: data,
      providerResponse: body,
    };
  }
}

