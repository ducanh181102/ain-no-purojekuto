import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderItem } from '@prisma/client';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';

@Injectable()
export class OrderItemService {
  // Đưa PrismaService vào để làm việc với database
  constructor(private prisma: PrismaService) {}

  // Các phương thức CRUD cho OrderItem
  // Lấy tất cả chi tiết đơn hàng
  findAll(includeOrder = false, includeDish = false): Promise<OrderItem[]> {
    // Khởi tạo biến chưa xóa là 2
    const isDeleted = '2';
    return this.prisma.orderItem.findMany({
      where: {
        isDeleted: isDeleted,
      },
      include: {
        order: includeOrder,
        dish: includeDish,
      }
    });
  }
  // Lấy một chi tiết đơn hàng (kể cả đã xóa) theo ID
  findOne(id: number): Promise<OrderItem | null> {
    return this.prisma.orderItem.findUnique({ where: { id } });
  }
  // Tạo mới một chi tiết đơn hàng
  create(dto: CreateOrderItemDto): Promise<OrderItem> {
    // kỹ thuật phân rã obj
    const {
      dishId,
      orderId,
      ...rest
    } = dto
    // Tạo biến data để setting vào 
    const data = {
      ...rest,
      dish: {
        connect: {
          id: dishId,
        },
      },
      order: {
        connect: {
          id: orderId,
        },
      },};
    return this.prisma.orderItem.create({ data: data });
  }
  // Cập nhật một chi tiết đơn hàng theo ID
  update(id: number, dto: UpdateOrderItemDto): Promise<OrderItem> {
    return this.prisma.orderItem.update({ where: { id }, data: dto });
  }
  // Xóa logic 1 chi tiết đơn hàng theo ID
  delete(id: number): Promise<OrderItem> { 
    // Tạo biến đã xóa là 1
    const isDeleted = '1';
    // Tạo biến ngày xóa
    const deleteAt = new Date();
    // Tạo biến data chứa thông tin fields
    const data = {
      isDeleted: isDeleted, 
      deleteAt: deleteAt,
    }
    return this.prisma.orderItem.update({ where: { id }, data: data})
  }
  // Xóa một chi tiết đơn hàng theo ID
  remove(id: number): Promise<OrderItem> {
    return this.prisma.orderItem.delete({ where: { id } });
  }
}
