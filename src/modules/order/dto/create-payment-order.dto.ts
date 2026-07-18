import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class CreatePaymentOrderDto {
  // buộc là enum
  @IsEnum(PaymentMethod)
  @IsOptional()
  method?: PaymentMethod;
}