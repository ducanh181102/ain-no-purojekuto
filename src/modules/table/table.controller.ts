import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { TableService } from './table.service';
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';

@Controller('tables')
export class TableController {
  // Đưa TableService vào để sử dụng trong controller
  constructor(private readonly tableService: TableService) {}

  @Get()
  findTableAll() {
    // Lấy tất cả bàn ăn từ tableService
    return this.tableService.findAll();
  }

  @Get()
  findTableById(id: number) {
    // Lấy 1 bàn ăn bằng ID
    return this.tableService.findOne(id)
  }

  @Post()
  createTable(@Body() dto: CreateTableDto) {
    // Thêm một bàn ăn
    return this.tableService.create(dto);
  }

  @Patch()
  updateTableById(@Body() dto: UpdateTableDto, id: number)  {
    // Cập nhật 1 bàn ăn theo id
    return this.tableService.update(id, dto);
  }

  @Patch()
  deleteLogicTableById(id: number) {
    // Xóa logic 1 bàn ăn
    return this.tableService.delete(id);
  }
}
