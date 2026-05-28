import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class CreatePaymentDto {
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
  amount!: number;

  // buộc là enum
  @IsEnum(PaymentMethod)
  @IsOptional()
  method?: PaymentMethod;

  // buộc là enum
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;
}