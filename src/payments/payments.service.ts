import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaystackService } from './providers/paystack.service';
import { FlutterwaveService } from './providers/flutterwave.service';
import { PaymentProvider } from './interfaces/payment-provider.interface';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { PaymentProvider as PaymentProviderEnum } from '@prisma/client';
import { EmailService } from '../common/services/email.service';
import { DiscordService } from '../common/services/discord.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private readonly providers: Map<string, PaymentProvider>;

  constructor(
    private prisma: PrismaService,
    private paystackService: PaystackService,
    private flutterwaveService: FlutterwaveService,
    private emailService: EmailService,
    private discordService: DiscordService,
  ) {
    this.providers = new Map();
    this.providers.set('PAYSTACK', paystackService);
    this.providers.set('FLUTTERWAVE', flutterwaveService);
    // PayPal can be added later
  }

  private getProvider(provider: string): PaymentProvider {
    const paymentProvider = this.providers.get(provider.toUpperCase());
    if (!paymentProvider) {
      throw new BadRequestException(`Payment provider ${provider} is not supported`);
    }
    return paymentProvider;
  }

  async initializePayment(userId: string, dto: InitializePaymentDto) {
    // Get order
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        user: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${dto.orderId} not found`);
    }

    if (order.userId !== userId) {
      throw new BadRequestException('Order does not belong to this user');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Order is not in pending status');
    }

    // Get payment provider
    const provider = this.getProvider(dto.provider);

    // Initialize payment
    const paymentInit = await provider.initializePayment({
      amount: Number(order.totalAmount),
      currency: 'NGN',
      email: order.user.email,
      reference: order.paymentReference || undefined,
      callbackUrl: dto.callbackUrl,
      metadata: {
        orderId: order.id,
        userId: userId,
      },
    });

    // Create or update transaction
    const transaction = await this.prisma.transaction.upsert({
      where: { reference: paymentInit.reference },
      update: {
        externalReference: paymentInit.metadata?.reference || paymentInit.metadata?.tx_ref,
      },
      create: {
        orderId: order.id,
        userId: userId,
        provider: dto.provider as PaymentProviderEnum,
        reference: paymentInit.reference,
        externalReference: paymentInit.metadata?.reference || paymentInit.metadata?.tx_ref,
        amount: order.totalAmount,
        status: 'PENDING',
        metadata: paymentInit.metadata,
      },
    });

    // Update order with payment reference
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentReference: paymentInit.reference,
        paymentProvider: dto.provider as PaymentProviderEnum,
        paymentStatus: 'PENDING',
      },
    });

    return {
      authorizationUrl: paymentInit.authorizationUrl,
      reference: paymentInit.reference,
      accessCode: paymentInit.accessCode,
      provider: dto.provider,
      transactionId: transaction.id,
    };
  }

  async verifyPayment(userId: string, dto: VerifyPaymentDto) {
    // Get transaction
    const transaction = await this.prisma.transaction.findUnique({
      where: { reference: dto.reference },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
            user: true,
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with reference ${dto.reference} not found`);
    }

    if (transaction.userId !== userId) {
      throw new BadRequestException('Transaction does not belong to this user');
    }

    // Get provider (use transaction provider or provided one)
    const providerName = dto.provider || transaction.provider;
    const provider = this.getProvider(providerName);

    // Verify payment
    const verification = await provider.verifyPayment(dto.reference);

    // Update transaction
    const updatedTransaction = await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: verification.status,
        metadata: verification.metadata,
      },
    });

    // Update order status if payment successful
    if (verification.status === 'SUCCESS') {
      await this.prisma.order.update({
        where: { id: transaction.orderId },
        data: {
          status: 'PROCESSING',
          paymentStatus: 'SUCCESS',
        },
      });

      // Reduce product stock
      for (const item of transaction.order.items) {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Send confirmation emails
      await this.sendOrderConfirmation(transaction.order);
    }

    return {
      status: verification.status,
      reference: verification.reference,
      amount: verification.amount,
      order: transaction.order,
    };
  }

  async handleWebhook(provider: string, body: any, signature: string) {
    const paymentProvider = this.getProvider(provider);
    
    // Verify webhook signature
    if (!paymentProvider.verifyWebhook(body, signature)) {
      this.logger.warn(`Invalid webhook signature from ${provider}`);
      throw new BadRequestException('Invalid webhook signature');
    }

    // Handle webhook
    const verification = await paymentProvider.handleWebhook(body);
    
    // Find transaction by reference
    const transaction = await this.prisma.transaction.findUnique({
      where: { reference: verification.reference },
      include: {
        order: {
          include: {
            items: {
              include: {
                product: true,
              },
            },
            user: true,
          },
        },
      },
    });

    if (!transaction) {
      this.logger.warn(`Transaction not found for reference: ${verification.reference}`);
      return { message: 'Transaction not found' };
    }

    // Update transaction
    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: verification.status,
        metadata: verification.metadata,
      },
    });

    // Update order if payment successful
    if (verification.status === 'SUCCESS' && transaction.order.status === 'PENDING') {
      await this.prisma.order.update({
        where: { id: transaction.orderId },
        data: {
          status: 'PROCESSING',
          paymentStatus: 'SUCCESS',
        },
      });

      // Reduce product stock
      for (const item of transaction.order.items) {
        await this.prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // Send notifications
      await this.sendOrderConfirmation(transaction.order);
    }

    return { message: 'Webhook processed successfully' };
  }

  private async sendOrderConfirmation(order: any) {
    // Send email
    this.emailService.sendTransactionEmail(order.user.email, {
      orderId: order.id,
      totalAmount: `₦${Number(order.totalAmount).toLocaleString()}`,
      items: order.items.map((item: any) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: `₦${Number(item.price).toLocaleString()}`,
      })),
      customerName: order.user.fullName,
    }).catch((error) => {
      this.logger.error('Failed to send order confirmation email:', error);
    });

    // Send Discord notification
    this.discordService.notifyTransaction({
      orderId: order.id,
      userId: order.userId,
      userEmail: order.user.email,
      totalAmount: `₦${Number(order.totalAmount).toLocaleString()}`,
      itemsCount: order.items.length,
      paymentMethod: order.paymentProvider || 'Unknown',
    }).catch((error) => {
      this.logger.error('Failed to send Discord notification:', error);
    });
  }
}

