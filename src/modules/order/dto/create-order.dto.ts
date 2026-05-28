import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  // buộc là string
  // buộc là enum
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  // ép kiểu về number
  // buộc là number
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
          example: '1',
  })
  tableId!: number;
}