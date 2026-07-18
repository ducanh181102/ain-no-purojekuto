import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '@prisma/client';

export class UpdateOrderDto {
  // buộc là string
  @IsString()
  @IsOptional()
  name?: string;

  // có thể gửi hoặc không
  // buộc là enum
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}