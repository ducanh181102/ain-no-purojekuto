import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDishDto {
  // buộc là string
  // buộc không được trống
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
      example: 'Ốc Hương Sào Tỏi',
  })
  name!: string;

  // ép kiểu về number
  // buộc là number
  @Type(()=>Number)
  @IsNumber()
  @ApiProperty({
    example: '30',
  })
  price!: number;

  // có thể gửi hoặc không
  // buộc là string
  @IsOptional()
  @IsString()
  image?: string;

  // Có thể gửi hoặc không
  // buộc là String
  @IsOptional()
  @IsString()
  available?: string;

  // ép kiểu về number
  // buộc là number
  @Type(() => Number)
  @IsNumber()
  @ApiProperty({
    example: '1',
  })
  categoryId!: number;
}