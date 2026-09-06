import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { DishModule } from './modules/dish/dish.module';
import { CategoryModule } from './modules/category/category.module';
import { OrderModule } from './modules/order/order.module';
import { TableModule } from './modules/table/table.module';
import { OrderItemModule } from './modules/orderitem/order-item.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ReservationModule } from './modules/reservation/reservation.module';

@Module({
  imports: [
    PrismaModule, 
    CategoryModule, 
    DishModule, 
    TableModule,
    OrderModule, 
    OrderItemModule,
    PaymentModule,
    ReservationModule,
  ],
})
export class AppModule {}
