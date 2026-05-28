import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Table } from '@prisma/client';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';

@Injectable()
export class TableService {
  // Đưa PrismaService vào để làm việc với database
  constructor(private prisma: PrismaService) {}

  // Các phương thức CRUD cho Table
  // Lấy tất cả bàn ăn
  findAll(): Promise<Table[]> {
    // Khởi tạo biến chưa xóa là 2
    const isDeleted = '2';
    return this.prisma.table.findMany({
      where: {
        isDeleted: isDeleted,
      },
    });
  }
  // Lấy một bàn ăn (kể cả đã xóa) theo ID
  findOne(id: number): Promise<Table | null> {
    return this.prisma.table.findUnique({ where: { id } });
  }
  // Tạo mới một bàn ăn
  create(dto: CreateTableDto): Promise<Table> {
    return this.prisma.table.create({ data: dto });
  }
  // Cập nhật một bàn ăn theo ID
  update(id: number, dto: UpdateTableDto): Promise<Table> {
    return this.prisma.table.update({ where: { id }, data: dto });
  }
  // Xóa logic 1 bàn ăn theo ID
  delete(id: number): Promise<Table> { 
    // Tạo biến đã xóa là 1
    const isDeleted = '1';
    // Tạo biến ngày xóa
    const deleteAt = new Date();
    // Tạo biến data chứa thông tin fields
    const data = {
      isDeleted: isDeleted, 
      deleteAt: deleteAt,
    }
    return this.prisma.table.update({ where: { id }, data: data });
  }
  // Xóa một bàn ăn theo ID
  remove(id: number): Promise<Table> {
    return this.prisma.table.delete({ where: { id } });
  }
}
