import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
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

  @Get()
  findDishById(id: number) {
    // Lấy 1 món ăn bằng ID
    return this.dishService.findOne(id)
  }

  @Post()
  createDish(@Body() dto: CreateDishDto) {
    // Thêm một món ăn
    return this.dishService.create(dto);
  }

  @Patch()
  updateDishById(@Body() dto: UpdateDishDto, id: number)  {
    // Cập nhật 1 món ăn theo id
    return this.dishService.update(id, dto);
  }

  @Patch()
  deleteLogicDishById(id: number) {
    // Xóa logic 1 món ăn
    return this.dishService.delete(id);
  }
}
