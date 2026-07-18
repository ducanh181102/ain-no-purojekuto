import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TableStatus } from '@prisma/client';

export class UpdateTableDto {
  // buộc là string
  @IsString()
  @IsOptional()
  name?: string;

  // ép kiểu về number
  // buộc là number
  @Type(()=>Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  capacity?: number;

  // có thể gửi hoặc không
  // buộc là enum
  @IsOptional()
  @IsEnum(TableStatus)
  status?: TableStatus;
}