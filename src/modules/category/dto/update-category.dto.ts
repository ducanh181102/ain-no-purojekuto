import { IsOptional, IsString } from 'class-validator';

export class UpdateCategoryDto {
  // buộc là string
  @IsString()
  @IsOptional()
  name?: string;
}