import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { CartModule } from './cart/cart.module';
import { CommonModule } from './common/common.module';
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, CommonModule, AuthModule, UserModule, ProductsModule, CategoriesModule, CartModule, OrdersModule, PaymentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
