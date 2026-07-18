import { forwardRef, Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TableModule } from '../table/table.module';
import { OrderItemModule } from '../orderitem/order-item.module';
import { PaymentModule } from '../payment/payment.module';

@Module({
  imports: [PrismaModule, TableModule, forwardRef(() =>OrderItemModule), PaymentModule],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService],
})
export class OrderModule {}
