import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoryController {
  // Đưa CategoryService vào để sử dụng trong controller
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  findCategoryAll() {
    // Lấy tất cả loại món ăn từ categoryService
    return this.categoryService.findAll();
  }

  @Get(':id')
  findCategoryById(@Param('id', ParseIntPipe) id: number) {
    // Lấy 1 loại món ăn bằng ID
    return this.categoryService.findOneOrThrow(id);
  }

  @Post()
  createCategory(@Body() dto: CreateCategoryDto) {
    // Thêm một loại món ăn
    return this.categoryService.create(dto);
  }

  @Patch(':id')
  updateCategoryById(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    // Cập nhật 1 loại món ăn theo id
    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  deleteLogicCategoryById(@Param('id', ParseIntPipe) id: number) {
    // Xóa logic 1 loại món ăn
    return this.categoryService.delete(id);
  }
}
