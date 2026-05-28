import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentStatus } from '@prisma/client';

export class UpdatePaymentDto {
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
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;
}