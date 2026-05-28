import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderDto {
  // buộc là string
  @IsString()
  @IsOptional()
  name?: string;

  // ép kiểu về number
  // buộc là number
  @Type(()=>Number)
  @IsOptional()
  @IsNumber()
  capacity?: number;

  // có thể gửi hoặc không
  // buộc là enum
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}