import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createOrder(@Request() req, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrderFromCart(req.user.id, dto);
  }

  @Get()
  getUserOrders(@Request() req) {
    return this.ordersService.getUserOrders(req.user.id);
  }

  @Get(':id')
  getOrder(@Request() req, @Param('id') id: string) {
    return this.ordersService.getOrder(req.user.id, id);
  }
}

