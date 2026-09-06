import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber } from 'class-validator';

export class MoveReservationDto {
  // ép kiểu về number
  // buộc là number
  @Type(() => Number)
  @IsNumber()
  @IsNotEmpty()
  tableId!: number;
}
