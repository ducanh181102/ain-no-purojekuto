import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Order, Payment, Prisma } from '@prisma/client';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentService {
  // Đưa PrismaService vào để làm việc với database
  constructor(private prisma: PrismaService) {}

  // Các phương thức CRUD cho Payment
  // Lấy tất cả đơn hàng
  async findAll(): Promise<Payment[]> {
    // Khởi tạo biến chưa xóa là 2
    const isDeleted = '2';
    return await this.prisma.payment.findMany({
      where: {
        isDeleted: isDeleted,
      },      
    });
  }

  // Lấy một đơn hàng (kể cả đã xóa) theo ID
  async findOne(id: number): Promise<Payment | null> {
    return await this.prisma.payment.findUnique({ where: { id } });
  }

  // Lấy Payment có thông tin
  async findOneOrThrow(id: number): Promise<Payment> {
    // 1. Tìm Payment
    const payment = await this.findOne(id);

    // 2. Payment có tồn tại không
    if (!payment) {
      throw new NotFoundException('Payment không tồn tại');
    }

    // 3. Payment có bị xoá không
    if (payment.isDeleted === '1') {
      throw new NotFoundException('Payment đã bị xoá');
    }

    // 4. Trả trị
    return payment;
  }

  // Tạo mới một đơn hàng
  async create(dto: CreatePaymentDto, tx?: Prisma.TransactionClient): Promise<Payment> {
    // 1. Chuẩn bị data
    // a. Kỹ thuật phân rã obj
    const {
      orderId,
      ...rest
    } = dto
    // b. Tạo biến data để setting vào 
    const data = {
      ...rest,
      order: {
        connect: {
          id: orderId,
        },
      },
    };
    // c. Khởi tạo biến client
    const client = tx ?? this.prisma;

    // 2. Trả trị
    return await client.payment.create({ data: data });
  }

  // Cập nhật một đơn hàng theo ID
  async update(id: number, dto: UpdatePaymentDto): Promise<Payment> {
    return await this.prisma.payment.update({ where: { id }, data: dto });
  }

  // Xóa logic 1 đơn hàng theo ID
  async delete(id: number): Promise<Payment> { 
    // Tạo biến đã xóa là 1
    const isDeleted = '1';
    // Tạo biến ngày xóa
    const deleteAt = new Date();
    // Tạo biến data chứa thông tin fields
    const data = {
      isDeleted: isDeleted, 
      deleteAt: deleteAt,
    }
    return await this.prisma.payment.update({ where: { id }, data: data})
  }

  // Xóa một đơn hàng theo ID
  async remove(id: number): Promise<Payment> {
    return await this.prisma.payment.delete({ where: { id } });
  }
}
