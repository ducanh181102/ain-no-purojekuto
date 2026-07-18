import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Order, Prisma, Table, TableStatus } from '@prisma/client';
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

  // Lấy bàn có thông tin
  async findOneOrThrow(id: number): Promise<Table> {
    // 1. Tìm table
    const table = await this.findOne(id);

    // 2. Bàn có tồn tại không
    if (!table) {
      throw new NotFoundException('Bàn không tồn tại');
    }

    // 3. Bàn có bị xoá không
    if (table.isDeleted === '1') {
      throw new NotFoundException('Bàn đã bị xoá');
    }

    // 4. Trả trị
    return table;
  }  

  // Tạo mới một bàn ăn
  create(dto: CreateTableDto): Promise<Table> {
    return this.prisma.table.create({ data: dto });
  }

  // Cập nhật một bàn ăn theo ID
  update(id: number, dto: UpdateTableDto, tx?: Prisma.TransactionClient): Promise<Table> {
    // 1. Tạo biến client
    const client = tx ?? this.prisma;
    // 2. Trả trị    
    return client.table.update({ where: { id }, data: dto });
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
    };
    return this.prisma.table.update({ where: { id }, data: data });
  }

  // Xóa một bàn ăn theo ID
  remove(id: number): Promise<Table> {
    return this.prisma.table.delete({ where: { id } });
  }

  // ^ Kiểm tra xem tableId có đang tồn tại
  async checkExist(id: number): Promise<void> {
    // Gán giá trị cho biến isExist
    const table = await this.findOne(id);

    // Trường hợp không có data hoặc đã xoá
    if (!table || '1' === table.isDeleted) {
      throw new NotFoundException('Không tìm thấy bàn');
    }
  }

  // ^ Kiểm tra xem tableId có đang là bàn trống
  async checkAvailable(id: number): Promise<void> {
    // Gán giá trị cho biến isExist
    const table = await this.findOne(id);

    // Trường hợp không còn trống
    if (table?.status !== TableStatus.AVAILABLE) {
      throw new BadRequestException('Bàn này đang có khách hoặc đã đặt trước');
    }
  }

  // ^ Kiểm tra xem table có trạng thái có hợp lệ
  async checkStatus(order: Table | null, status: TableStatus, valid: boolean): Promise<void> {
    // Xử lsy kiểm tra
    if ((!valid && order?.status === status) || (valid && order?.status !== status)) {
      throw new BadRequestException('Trạng thái của đơn hàng không hợp lệ');
    }
  }

  // * Chuyển trạng thái cho bàn thành có khách
  async occupied(id: number, tx?: Prisma.TransactionClient): Promise<Table> {
    // 1. Chuẩn bị data
    // a. Tạo biến valid là kiểm tra không phù hợp
    const valid = false;
    // b. Chuẩn bị data update
    const data = {
      status: TableStatus.OCCUPIED,
    }

    // 2. Kiểm tra có tồn tại
    await this.checkExist(id)

    // 3. Tìm table theo id
    const table = await this.findOne(id);

    // 4. Kiểm tra trạng thái hiện tại
    await this.checkStatus(table, TableStatus.OCCUPIED, valid);

    // 5. Cập nhật status sang là có khách
    const updateTable = await this.update(id, data, tx)

    // 6. Trả về table đã cập nhật
    return updateTable;
  }

  // * Chuyển trạng thái cho bàn thành có sẵn
  async available(id: number, tx?: Prisma.TransactionClient): Promise<Table> {
    // 1. Chuẩn bị data
    // a. Tạo biến valid là kiểm tra phù hợp
    const valid = true;
    // b. Chuẩn bị data update
    const data = {
      status: TableStatus.AVAILABLE,
    }

    // 2. Kiểm tra có tồn tại
    await this.checkExist(id)

    // 3. Tìm table theo id
    const table = await this.findOne(id);

    // 4. Kiểm tra trạng thái hiện tại phải là đã phục vụ
    await this.checkStatus(table, TableStatus.OCCUPIED, valid);

    // 5. Cập nhật status sang là có sẵn
    const updateTable = await this.update(id, data, tx)

    // 6. Trả về table đã cập nhật
    return updateTable;
  }
}
