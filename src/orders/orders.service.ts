import { Decimal } from '@prisma/client/runtime/library';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';


@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async createOrderFromCart(userId: string, dto: CreateOrderDto) {
    // Get user's cart with items
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Validate stock availability
    for (const item of cart.items) {
      if (!item.product.isActive) {
        throw new BadRequestException(`Product ${item.product.name} is not available`);
      }
      if (item.product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for ${item.product.name}. Available: ${item.product.stock}, Requested: ${item.quantity}`,
        );
      }
    }

    // Calculate totals
    let subtotal = 0;
    for (const item of cart.items) {
      const itemPrice = Number(item.product.price);
      const itemDiscount = Number(item.product.discount);
      const discountedPrice = itemPrice * (1 - itemDiscount / 100);
      subtotal += discountedPrice * item.quantity;
    }

    const shippingFee = new Decimal(0); // Can be calculated based on address
    const discount = new Decimal(0); // Can apply coupon codes later
    const totalAmount = new Decimal(subtotal).plus(shippingFee).minus(discount);

    // Create order
    const order = await this.prisma.order.create({
      data: {
        userId,
        status: 'PENDING',
        subtotal: new Decimal(subtotal),
        shippingFee,
        discount,
        totalAmount,
        shippingAddress: dto.shippingAddress as any,
        paymentMethod: dto.paymentMethod,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    // Create order items
    const orderItems = await Promise.all(
      cart.items.map((item) => {
        const itemPrice = Number(item.product.price);
        const itemDiscount = Number(item.product.discount);
        const discountedPrice = itemPrice * (1 - itemDiscount / 100);

        return this.prisma.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: new Decimal(discountedPrice),
            discount: new Decimal(itemDiscount),
          },
          include: {
            product: true,
          },
        });
      }),
    );

    // Clear cart after order creation
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return {
      ...order,
      items: orderItems,
    };
  }

  async getOrder(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    if (order.userId !== userId) {
      throw new BadRequestException('Order does not belong to this user');
    }

    return order;
  }

  async getUserOrders(userId: string) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders;
  }
}

