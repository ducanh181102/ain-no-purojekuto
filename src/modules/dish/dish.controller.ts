import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { DishService } from './dish.service';
import { CreateDishDto } from './dto/create-dish.dto';
import { UpdateDishDto } from './dto/update-dish.dto';

@Controller('dishes')
export class DishController {
  // Đưa DishService vào để sử dụng trong controller
  constructor(private readonly dishService: DishService) {}

  @Get()
  findDishAll(@Query('includeCategory') includeCategory?: string) {
    // Lấy tất cả món ăn từ dishService
    return this.dishService.findAll(includeCategory === 'true');
  }

  @Get(':id')
  findDishById(@Param('id', ParseIntPipe) id: number) {
    // Lấy 1 món ăn bằng ID
    return this.dishService.findOneOrThrow(id);
  }

  @Post()
  createDish(@Body() dto: CreateDishDto) {
    // Thêm một món ăn
    return this.dishService.create(dto);
  }

  @Patch(':id')
  updateDishById(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDishDto,
  ) {
    // Cập nhật 1 món ăn theo id
    return this.dishService.update(id, dto);
  }

  @Delete(':id')
  deleteLogicDishById(@Param('id', ParseIntPipe) id: number) {
    // Xóa logic 1 món ăn
    return this.dishService.delete(id);
  }
}
