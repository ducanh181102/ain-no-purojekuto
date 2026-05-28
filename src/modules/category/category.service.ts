import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Category } from '@prisma/client';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  // Đưa PrismaService vào để làm việc với database
  constructor(private prisma: PrismaService) {}

  // Các phương thức CRUD cho Category
  // Lấy tất cả loại món ăn
  findAll(): Promise<Category[]> {
    // Khởi tạo biến chưa xóa là 2
    const isDeleted = '2';
    return this.prisma.category.findMany({
      where: {
        isDeleted: isDeleted,
      },
    }
    );
  }
  // Lấy một loại món ăn (kể cả đã xóa) theo ID
  findOne(id: number): Promise<Category | null> {
    return this.prisma.category.findUnique({ where: { id } });
  }
  // Tạo mới một loại món ăn
  create(dto: CreateCategoryDto): Promise<Category> {
    return this.prisma.category.create({ data: dto });
  }
  // Cập nhật một loại món ăn theo ID
  update(id: number, dto: UpdateCategoryDto): Promise<Category> {
    return this.prisma.category.update({ where: { id }, data: dto });
  }
  // Xóa logic 1 loại món ăn theo ID
  async delete(id: number): Promise<Category> {
    // Tạo biến đã xóa là 1
    const isDeleted = '1'; 
    // Tạo biến ngày xóa
    const deleteAt = new Date(); 
    // Tạo biến data chứa thông tin fields
    const data = {
      isDeleted: isDeleted, 
      deleteAt: deleteAt,
    }
    const [category] = await this.prisma.$transaction([      
      // xóa logic loại món ăn
      this.prisma.category.update({
        where: {id},
        data: data,
      }),
      // xóa logic từng món ăn thuộc loại món ăn này
      this.prisma.dish.updateMany({
        where: {categoryId : id,},
        data: data,
      })
    ]);
    return category;    
  }
  // Xóa một loại món ăn theo ID
  remove(id: number): Promise<Category> {
    return this.prisma.category.delete({ where: { id } });
  }
}
