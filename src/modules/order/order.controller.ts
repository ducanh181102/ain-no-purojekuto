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
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CreatePaymentOrderDto } from './dto/create-payment-order.dto';

@Controller('orders')
export class OrderController {
  // Đưa OrderService vào để sử dụng trong controller
  constructor(private readonly orderService: OrderService) {}

  @Get()
  findOrderAll(@Query('includeTable') includeTable?: string) {
    // Lấy tất cả đơn hàng từ orderService
    return this.orderService.findAll(includeTable === 'true');
  }

  @Get(':id')
  findOrderById(@Param('id', ParseIntPipe) id: number) {
    // Lấy 1 đơn hàng bằng ID
    return this.orderService.findOneOrThrow(id);
  }

  @Post()
  createOrder(@Body() dto: CreateOrderDto) {
    // Thêm một đơn hàng
    return this.orderService.create(dto);
  }

  @Patch(':id')
  updateOrderById(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateOrderDto,
  ) {
    if (dto.status) {
      throw new BadRequestException('Không được cập nhật status trực tiếp');
    }
    // Cập nhật 1 đơn hàng theo id
    return this.orderService.update(id, dto);
  }

  @Patch(':id/pay')
  payOrder(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreatePaymentOrderDto,
  ) {
    // Thanh toán
    return this.orderService.pay(id, dto);
  }

  @Patch(':id/cancel')
  cancelOrder(
    @Param('id', ParseIntPipe) id: number,
  ) {
    // Huỷ đơn (khi vừa tạo đơn)
    return this.orderService.cancel(id);
  }

  @Delete(':id')
  deleteLogicOrderById(@Param('id', ParseIntPipe) id: number) {
    // Xóa logic 1 đơn hàng
    return this.orderService.delete(id);
  }
}
