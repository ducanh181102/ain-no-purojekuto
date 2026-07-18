import { forwardRef, Module } from '@nestjs/common';
import { OrderItemController } from './order-item.controller';
import { OrderItemService } from './order-item.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { OrderModule } from '../order/order.module';
import { DishModule } from '../dish/dish.module';

@Module({
  imports: [PrismaModule, forwardRef(() =>OrderModule), DishModule],
  controllers: [OrderItemController],
  providers: [OrderItemService],
  exports: [OrderItemService],
})
export class OrderItemModule {}
