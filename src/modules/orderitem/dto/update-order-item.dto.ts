import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderItemStatus } from '@prisma/client';

export class UpdateOrderItemDto {
  // ép kiểu về number
  // buộc là number
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  orderId?: number;

  // ép kiểu về number
  // buộc là number
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  dishId?: number;

  // ép kiểu về number
  // buộc là number
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  quantity?: number;

  // ép kiểu về number
  // buộc là number
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  price?: number;

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