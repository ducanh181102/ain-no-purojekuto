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
  quantity!: number;

  // ép kiểu về number
  // buộc là number
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  price!: number;

  // Có thể gửi hoặc không
  // buộc là String
  @IsOptional()
  @IsString()
  note?: string;

  // buộc là string
  // buộc là enum
  @IsEnum(OrderItemStatus)
  @IsOptional()
  status?: OrderItemStatus;
}