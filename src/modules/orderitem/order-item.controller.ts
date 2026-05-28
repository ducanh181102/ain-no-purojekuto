import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { OrderItemService } from './order-item.service';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';

@Controller('order-items')
export class OrderItemController {
  // Đưa OrderItemService vào để sử dụng trong controller
  constructor(private readonly orderItemService: OrderItemService) {}

  @Get()
  findOrderItemAll(
    @Query('includeOrder') includeOrder?: string,
    @Query('includeDish') includeDish?: string,
  ) {
    // Lấy tất cả chi tiết đơn hàng từ orderService
    return this.orderItemService.findAll(
      // toán tử đảm bảo trị luôn là true/false
      includeOrder === 'true',
      includeDish === 'true',
    );
  }

  @Get()
  findOrderItemById(id: number) {
    // Lấy 1 chi tiết đơn hàng bằng ID
    return this.orderItemService.findOne(id)
  }

  @Post()
  createOrderItem(@Body() dto: CreateOrderItemDto) {
    // Thêm một chi tiết đơn hàng
    return this.orderItemService.create(dto);
  }

  @Patch()
  updateOrderItemById(@Body() dto: UpdateOrderItemDto, id: number)  {
    // Cập nhật 1 chi tiết đơn hàng theo id
    return this.orderItemService.update(id, dto);
  }

  @Patch()
  deleteLogicOrderItemById(id: number) {
    // Xóa logic 1 chi tiết đơn hàng
    return this.orderItemService.delete(id);
  }
}
