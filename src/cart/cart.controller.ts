import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // GET /cart - Get user's cart
  @Get()
  getCart(@Request() req) {
    return this.cartService.getCart(req.user.id);
  }

  // POST /cart/items - Add item to cart
  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  addItem(@Request() req, @Body() addCartItemDto: AddCartItemDto) {
    return this.cartService.addItem(req.user.id, addCartItemDto);
  }

  // PATCH /cart/items/:id - Update cart item quantity
  @Patch('items/:id')
  @HttpCode(HttpStatus.OK)
  updateItem(
    @Request() req,
    @Param('id') id: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(req.user.id, id, updateCartItemDto);
  }

  // DELETE /cart/items/:id - Remove item from cart
  @Delete('items/:id')
  @HttpCode(HttpStatus.OK)
  removeItem(@Request() req, @Param('id') id: string) {
    return this.cartService.removeItem(req.user.id, id);
  }

  // DELETE /cart - Clear cart
  @Delete()
  @HttpCode(HttpStatus.OK)
  clearCart(@Request() req) {
    return this.cartService.clearCart(req.user.id);
  }
}

