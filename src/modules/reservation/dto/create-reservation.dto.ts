import { Type } from 'class-transformer';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateReservationDto {
  // ép kiểu về number
  // buộc là number
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  tableId!: number;

  // buộc là string
  // buộc không được trống
  @IsString()
  @IsNotEmpty()
  customerName!: string;

  // có thể gửi hoặc không
  // buộc là string
  @IsOptional()
  @IsString()
  phone?: string;

  // ép kiểu về number
  // buộc là number
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  guestCount?: number;

  // buộc là chuỗi ngày giờ ISO
  @IsDateString()
  reservedAt!: string;

  // có thể gửi hoặc không
  // buộc là string
  @IsOptional()
  @IsString()
  note?: string;
}
