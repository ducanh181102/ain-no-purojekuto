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
import { CreateTableDto } from './dto/create-table.dto';
import { UpdateTableDto } from './dto/update-table.dto';
import { TableService } from './table.service';

@Controller('tables')
export class TableController {
  // Đưa TableService vào để sử dụng trong controller
  constructor(private readonly tableService: TableService) {}

  @Get()
  findTableAll() {
    // Lấy tất cả bàn ăn từ tableService
    return this.tableService.findAll();
  }

  @Get(':id')
  findTableById(@Param('id', ParseIntPipe) id: number) {
    // Lấy 1 bàn ăn bằng ID
    return this.tableService.findOneOrThrow(id);
  }

  @Post()
  createTable(@Body() dto: CreateTableDto) {
    // Thêm một bàn ăn
    return this.tableService.create(dto);
  }

  @Patch(':id')
  updateTableById(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTableDto,
  ) {
    const allowedFields = ['name', 'capacity'];
    const invalidFields = Object.entries(dto)
      .filter(([, value]) => value !== undefined)
      .map(([field]) => field)
      .filter((field) => !allowedFields.includes(field));

    if (invalidFields.length) {
      throw new BadRequestException(
        `Không được cập nhật trực tiếp: ${invalidFields.join(', ')}`,
      );
    }

    // Cập nhật 1 bàn ăn theo id
    return this.tableService.update(id, dto);
  }

  @Delete(':id')
  deleteLogicTableById(@Param('id', ParseIntPipe) id: number) {
    // Xóa logic 1 bàn ăn
    return this.tableService.delete(id);
  }
}
