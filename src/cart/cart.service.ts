import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  // Get or create user's cart
  async getOrCreateCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                price: true,
                discount: true,
                stock: true,
                images: true,
                isActive: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          userId,
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  description: true,
                  price: true,
                  discount: true,
                  stock: true,
                  images: true,
                  isActive: true,
                },
              },
            },
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });
    }

    return cart;
  }

  // Get user's cart
  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    return cart;
  }

  // Add item to cart
  async addItem(userId: string, addCartItemDto: AddCartItemDto) {
    // Get or create cart
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          userId,
        },
      });
    }

    // Check if product exists and is active
    const product = await this.prisma.product.findUnique({
      where: { id: addCartItemDto.productId },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with ID ${addCartItemDto.productId} not found`,
      );
    }

    if (!product.isActive) {
      throw new BadRequestException(
        `Product with ID ${addCartItemDto.productId} is not active`,
      );
    }

    // Check if product is in stock
    if (product.stock < addCartItemDto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.stock}, Requested: ${addCartItemDto.quantity}`,
      );
    }

    // Check if item already exists in cart
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId: addCartItemDto.productId,
        },
      },
    });

    if (existingItem) {
      // Update quantity (ensure total doesn't exceed stock)
      const newQuantity = existingItem.quantity + addCartItemDto.quantity;
      if (newQuantity > product.stock) {
        throw new BadRequestException(
          `Cannot add quantity. Total would exceed available stock of ${product.stock}`,
        );
      }

      const updatedItem = await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              description: true,
              price: true,
              discount: true,
              stock: true,
              images: true,
              isActive: true,
            },
          },
        },
      });

      return this.getCart(userId);
    }

    // Create new cart item
    await this.prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId: addCartItemDto.productId,
        quantity: addCartItemDto.quantity,
      },
    });

    return this.getCart(userId);
  }

  // Update cart item quantity
  async updateItem(userId: string, itemId: string, updateCartItemDto: UpdateCartItemDto) {
    // Verify cart belongs to user
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Check if item exists and belongs to user's cart
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        product: true,
      },
    });

    if (!item) {
      throw new NotFoundException(`Cart item with ID ${itemId} not found`);
    }

    if (item.cartId !== cart.id) {
      throw new BadRequestException('Cart item does not belong to your cart');
    }

    // Check stock availability
    if (updateCartItemDto.quantity > item.product.stock) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${item.product.stock}, Requested: ${updateCartItemDto.quantity}`,
      );
    }

    // Update quantity
    await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: updateCartItemDto.quantity },
    });

    return this.getCart(userId);
  }

  // Remove item from cart
  async removeItem(userId: string, itemId: string) {
    // Verify cart belongs to user
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Check if item exists and belongs to user's cart
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException(`Cart item with ID ${itemId} not found`);
    }

    if (item.cartId !== cart.id) {
      throw new BadRequestException('Cart item does not belong to your cart');
    }

    // Delete item
    await this.prisma.cartItem.delete({
      where: { id: itemId },
    });

    return this.getCart(userId);
  }

  // Clear cart (remove all items)
  async clearCart(userId: string) {
    // Get user's cart
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Delete all cart items
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    return {
      message: 'Cart cleared successfully',
      cart: await this.getCart(userId),
    };
  }
}

