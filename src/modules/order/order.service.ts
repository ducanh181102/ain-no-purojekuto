import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Order } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderService {
  // Đưa PrismaService vào để làm việc với database
  constructor(private prisma: PrismaService) {}

  // Các phương thức CRUD cho Order
  // Lấy tất cả đơn hàng
  findAll(includeTable = false): Promise<Order[]> {
    // Khởi tạo biến chưa xóa là 2
    const isDeleted = '2';
    return this.prisma.order.findMany({
      where: {
        isDeleted: isDeleted,
      },
      include: {
        table: includeTable,
      }
    });
  }
  // Lấy một đơn hàng (kể cả đã xóa) theo ID
  findOne(id: number): Promise<Order | null> {
    return this.prisma.order.findUnique({ where: { id } });
  }
  // Tạo mới một đơn hàng
  create(dto: CreateOrderDto): Promise<Order> {
    // kỹ thuật phân rã obj
    const {
      tableId,
      ...rest
    } = dto
    // Tạo biến data để setting vào 
    const data = {
      ...rest,
      table: {
        connect: {
          id: tableId,
        },
      },};
    return this.prisma.order.create({ data: data });
  }
  // Cập nhật một đơn hàng theo ID
  update(id: number, dto: UpdateOrderDto): Promise<Order> {
    return this.prisma.order.update({ where: { id }, data: dto });
  }
  // Xóa logic 1 đơn hàng theo ID
  async delete(id: number): Promise<Order> { 
    // Tạo biến đã xóa là 1
    const isDeleted = '1';
    // Tạo biến ngày xóa
    const deleteAt = new Date();
    // Tạo biến data chứa thông tin fields
    const data = {
      isDeleted: isDeleted, 
      deleteAt: deleteAt,
    }
    const [order] = await this.prisma.$transaction([      
      // xóa logic đơn hàng
      this.prisma.order.update({
        where: {id},
        data: data,
      }),
      // xóa logic từng chi tiết đơn hàng thuộc đơn hàng này
      this.prisma.orderItem.updateMany({
        where: {orderId : id,},
        data: data,
      })
    ]);
    return order;
  }
  // Xóa một đơn hàng theo ID
  remove(id: number): Promise<Order> {
    return this.prisma.order.delete({ where: { id } });
  }
}
