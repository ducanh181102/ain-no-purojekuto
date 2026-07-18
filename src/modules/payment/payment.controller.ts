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
} from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Controller('payments')
export class PaymentController {
  // Đưa PaymentService vào để sử dụng trong controller
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  findPaymentAll() {
    // Lấy tất cả đơn hàng từ paymentService
    return this.paymentService.findAll();
  }

  @Get(':id')
  findPaymentById(@Param('id', ParseIntPipe) id: number) {
    // Lấy 1 đơn hàng bằng ID
    return this.paymentService.findOneOrThrow(id);
  }

  @Post()
  createPayment(@Body() dto: CreatePaymentDto) {
    // Chặn không cho client thao tác trực tiếp
    throw new BadRequestException('Không được tạo payment trực tiếp');
  }

  @Patch(':id')
  updatePaymentById(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePaymentDto,
  ) {
    // Chặn không cho client thao tác trực tiếp
    throw new BadRequestException('Không được cập nhật payment trực tiếp');
  }

  @Delete(':id')
  deleteLogicPaymentById(@Param('id', ParseIntPipe) id: number) {
    // Xóa logic 1 đơn hàng
    return this.paymentService.delete(id);
  }
}
