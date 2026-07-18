import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderItemStatus } from '@prisma/client';

export class CreateOrderItemDto {
  // ép kiểu về number
  // buộc là number
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  orderId!: number;

  // ép kiểu về number
  // buộc là number
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  dishId!: number;

  // ép kiểu về number
  // buộc là number
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  quantity!: number;

  // Có thể gửi hoặc không
  // buộc là String
  @IsOptional()
  @IsString()
  note?: string;
}