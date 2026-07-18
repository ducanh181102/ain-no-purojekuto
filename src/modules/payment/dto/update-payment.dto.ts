import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class UpdatePaymentDto {
  // ép kiểu về number
  // buộc là number
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  amount?: number;

  // buộc là enum
  @IsEnum(PaymentMethod)
  @IsOptional()
  method?: PaymentMethod;

  // buộc là enum
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;
}