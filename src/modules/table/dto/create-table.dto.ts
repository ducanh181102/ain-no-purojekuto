import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { TableStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTableDto {
  // buộc là string
  // buộc không được trống
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
        example: '1',
  })
  name!: string;

  // ép kiểu về number
  // buộc là number
  @Type(()=>Number)
  @IsOptional()
  @IsNumber()
  capacity?: number;

  // có thể gửi hoặc không
  // buộc là enum
  @IsOptional()
  @IsEnum(TableStatus)
  status?: TableStatus;
}