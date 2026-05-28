import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Payment } from '@prisma/client';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@Injectable()
export class PaymentService {
  // Đưa PrismaService vào để làm việc với database
  constructor(private prisma: PrismaService) {}

  // Các phương thức CRUD cho Payment
  // Lấy tất cả đơn hàng
  findAll(): Promise<Payment[]> {
    // Khởi tạo biến chưa xóa là 2
    const isDeleted = '2';
    return this.prisma.payment.findMany({
      where: {
        isDeleted: isDeleted,
      },      
    });
  }
  // Lấy một đơn hàng (kể cả đã xóa) theo ID
  findOne(id: number): Promise<Payment | null> {
    return this.prisma.payment.findUnique({ where: { id } });
  }
  // Tạo mới một đơn hàng
  create(dto: CreatePaymentDto): Promise<Payment> {
    // kỹ thuật phân rã obj
    const {
      orderId,
      ...rest
    } = dto
    // Tạo biến data để setting vào 
    const data = {
      ...rest,
      order: {
        connect: {
          id: orderId,
        },
      },};
    return this.prisma.payment.create({ data: data });
  }
  // Cập nhật một đơn hàng theo ID
  update(id: number, dto: UpdatePaymentDto): Promise<Payment> {
    return this.prisma.payment.update({ where: { id }, data: dto });
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
    return this.prisma.payment.update({ where: { id }, data: data})
  }
  // Xóa một đơn hàng theo ID
  remove(id: number): Promise<Payment> {
    return this.prisma.payment.delete({ where: { id } });
  }
}
