import { Type } from 'class-transformer';
import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateReservationDto {
  // buộc là string
  @IsOptional()
  @IsString()
  customerName?: string;

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
  @IsOptional()
  @IsDateString()
  reservedAt?: string;

  // có thể gửi hoặc không
  // buộc là string
  @IsOptional()
  @IsString()
  note?: string;
}
