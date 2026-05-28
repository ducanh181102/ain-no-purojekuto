import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Controller('orders')
export class OrderController {
  // Đưa OrderService vào để sử dụng trong controller
  constructor(private readonly orderService: OrderService) {}

  @Get()
  findOrderAll(@Query("includeTable") includeTable?: string) {
    // Lấy tất cả đơn hàng từ orderService
    return this.orderService.findAll(includeTable === 'true');
  }

  @Get()
  findOrderById(id: number) {
    // Lấy 1 đơn hàng bằng ID
    return this.orderService.findOne(id)
  }

  @Post()
  createOrder(@Body() dto: CreateOrderDto) {
    // Thêm một đơn hàng
    return this.orderService.create(dto);
  }

  @Patch()
  updateOrderById(@Body() dto: UpdateOrderDto, id: number)  {
    // Cập nhật 1 đơn hàng theo id
    return this.orderService.update(id, dto);
  }

  @Patch()
  deleteLogicOrderById(id: number) {
    // Xóa logic 1 đơn hàng
    return this.orderService.delete(id);
  }
}
