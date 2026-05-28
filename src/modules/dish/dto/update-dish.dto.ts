import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateDishDto {
  // buộc là string
  @IsString()
  @IsOptional()
  name?: string;

  // ép kiểu về number
  // buộc là number
  @Type(()=>Number)
  @IsOptional()
  @IsNumber()
  price?: number;

  // có thể gửi hoặc không
  // buộc là string
  @IsOptional()
  @IsString()
  image?: string;

  // Có thể gửi hoặc không
  // buộc là string
  @IsOptional()
  @IsBoolean()
  available?: string;
}