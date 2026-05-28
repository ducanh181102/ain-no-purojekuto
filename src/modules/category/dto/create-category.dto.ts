import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCategoryDto {
  // buộc là string
  // buộc không được trống
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'Đồ ăn',
  })
  name!: string;
}