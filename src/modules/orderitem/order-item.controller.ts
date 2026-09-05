import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { OrderItemService } from './order-item.service';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';

@Controller('order-items')
export class OrderItemController {
  // Đưa OrderItemService vào để sử dụng trong controller
  constructor(private readonly orderItemService: OrderItemService) { }

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

  @Get('order/:orderId')
  findAllByOrder(
    @Param('orderId', ParseIntPipe) orderId: number,
    @Query('includeOrder') includeOrder?: string,
    @Query('includeDish') includeDish?: string,
  ) {
    return this.orderItemService.findAllByOrder(
      orderId,
      includeOrder === 'true',
      includeDish === 'true',
    );
  }

  @Get(':id')
  findOrderItemById(@Param('id', ParseIntPipe) id: number) {
    // Lấy 1 chi tiết đơn hàng bằng ID
    return this.orderItemService.findOneOrThrow(id);
  }

  @Post()
  createOrderItem(@Body() dto: CreateOrderItemDto) {
    // Thêm một chi tiết đơn hàng
    return this.orderItemService.create(dto);
  }

  @Patch(':id')
  updateOrderItemById(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderItemDto,
  ) {
    const allowedFields = ['note', 'quantity'];
    const invalidFields = Object.entries(dto)
      .filter(([, value]) => value !== undefined)
      .map(([field]) => field)
      .filter((field) => !allowedFields.includes(field));

    if (invalidFields.length) {
      throw new BadRequestException(
        `Không được cập nhật trực tiếp: ${invalidFields.join(', ')}`,
      );
    }

    if (dto.quantity !== undefined && dto.quantity < 1) {
      throw new BadRequestException('Số lượng món phải lớn hơn 0');
    }

    // Cập nhật 1 chi tiết đơn hàng theo id
    return this.orderItemService.update(id, dto);
  }

  @Patch(':id/confirm')
  confirmOrderItem(
    @Param('id', ParseIntPipe) id: number,
  ) {
    // Trả về chi tiết đơn hàng đã xác nhận
    return this.orderItemService.confirm(id);
  }

  @Patch(':id/cooking')
  cookingOrderItem(
    @Param('id', ParseIntPipe) id: number,
  ) {
    // Trả về chi tiết đơn hàng bắt đầu nấu
    return this.orderItemService.cooking(id);
  }

  @Patch(':id/ready')
  readyOrderItem(
    @Param('id', ParseIntPipe) id: number,
  ) {
    // Trả về chi tiết đơn hàng đã nấu xong
    return this.orderItemService.ready(id);
  }

  @Patch(':id/served')
  servedOrderItem(
    @Param('id', ParseIntPipe) id: number,
  ) {
    // Trả về chi tiết đơn hàng đã phục vụ
    return this.orderItemService.served(id);
  }

  @Patch(':id/cancel')
  cancelOrderItem(
    @Param('id', ParseIntPipe) id: number,
  ) {
    // Trả về chi tiết đơn hàng đã huỷ
    return this.orderItemService.cancel(id);
  }

  @Delete(':id')
  deleteLogicOrderItemById(@Param('id', ParseIntPipe) id: number) {
    // Xóa logic 1 chi tiết đơn hàng
    return this.orderItemService.delete(id);
  }
}
