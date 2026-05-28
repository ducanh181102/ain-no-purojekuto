import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Dish } from '@prisma/client';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';

@Injectable()
export class DishService {
  // Đưa PrismaService vào để làm việc với database
  constructor(private prisma: PrismaService) {}

  // Các phương thức CRUD cho Dish
  // Lấy tất cả món ăn
  findAll(includeCategory = false): Promise<Dish[]> {
    // Khởi tạo biến chưa xóa là 2
    const isDeleted = '2';
    return this.prisma.dish.findMany({
      where: {
        isDeleted: isDeleted,
      },
      include: {
        category: includeCategory,
      }
    }
    );
  }
  // Lấy một món ăn (kể cả đã xóa) theo ID
  findOne(id: number): Promise<Dish | null> {
    return this.prisma.dish.findUnique({ where: { id } });
  }
  // Tạo mới một món ăn
  create(dto: CreateDishDto): Promise<Dish> {
    // Kỹ thuật destructuring phân rã obj
    const {
      categoryId,
      ...rest
    } = dto;
    // Tạo biến data để setting vào 
    const data = {
      // ...rest : kỹ thuật spread operator, khui ra lây phần ruột
      ...rest,
      category: {
        connect: {
          id: categoryId,
        },
      },};
    return this.prisma.dish.create({ data: data });
  }
  // Cập nhật một món ăn theo ID
  update(id: number, dto: UpdateDishDto): Promise<Dish> {
    // update thì gán trực tiếp data không cần connect
    // vì prisma du di cho việc update, 
    // không phải create 1 quan hệ mới
    return this.prisma.dish.update({ where: { id }, data: dto });
  }
  // Xóa logic 1 món ăn theo ID
  delete(id: number): Promise<Dish> { 
    // Tạo biến đã xóa là 1
    const isDeleted = '1';
    // Tạo biến ngày xóa
    const deleteAt = new Date();
    // Tạo biến data chứa thông tin fields
    const data = {
      isDeleted: isDeleted, 
      deleteAt: deleteAt,
    }
    return this.prisma.dish.update({ where: { id }, data: data });
  }
  // Xóa một món ăn theo ID
  remove(id: number): Promise<Dish> {
    return this.prisma.dish.delete({ where: { id } });
  }
}
