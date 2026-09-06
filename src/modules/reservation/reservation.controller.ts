import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ReservationStatus } from '@prisma/client';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { MoveReservationDto } from './dto/move-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationService } from './reservation.service';

@Controller('reservations')
export class ReservationController {
  // Đưa ReservationService vào để sử dụng trong controller
  constructor(private readonly reservationService: ReservationService) {}

  @Get()
  findReservationAll(
    @Query('includeTable') includeTable?: string,
    @Query('includeOrder') includeOrder?: string,
    @Query('status') status?: ReservationStatus,
    @Query('tableId') tableId?: string,
  ) {
    // Lấy tất cả đặt bàn
    return this.reservationService.findAll(
      includeTable === 'true',
      includeOrder === 'true',
      status,
      tableId ? Number(tableId) : undefined,
    );
  }

  @Get('table/:tableId/current')
  findCurrentReservationByTableId(@Param('tableId', ParseIntPipe) tableId: number) {
    // Lấy đặt bàn đang mở theo bàn
    return this.reservationService.findCurrentByTableId(tableId);
  }

  @Get(':id')
  findReservationById(@Param('id', ParseIntPipe) id: number) {
    // Lấy 1 đặt bàn bằng ID
    return this.reservationService.findOneOrThrow(id);
  }

  @Post()
  createReservation(@Body() dto: CreateReservationDto) {
    // Tạo đặt bàn
    return this.reservationService.create(dto);
  }

  @Patch(':id')
  updateReservationById(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateReservationDto,
  ) {
    const allowedFields = ['customerName', 'phone', 'guestCount', 'reservedAt', 'note'];
    const invalidFields = Object.entries(dto)
      .filter(([, value]) => value !== undefined)
      .map(([field]) => field)
      .filter((field) => !allowedFields.includes(field));

    if (invalidFields.length) {
      throw new BadRequestException(
        `Không được cập nhật trực tiếp: ${invalidFields.join(', ')}`,
      );
    }

    // Cập nhật thông tin đặt bàn
    return this.reservationService.update(id, dto);
  }

  @Patch(':id/check-in')
  checkInReservation(@Param('id', ParseIntPipe) id: number) {
    // Nhận bàn: tạo order và chuyển bàn sang đang phục vụ
    return this.reservationService.checkIn(id);
  }

  @Patch(':id/move-table')
  moveReservation(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MoveReservationDto,
  ) {
    // Đổi bàn đặt trước
    return this.reservationService.moveTable(id, dto);
  }

  @Patch(':id/cancel')
  cancelReservation(@Param('id', ParseIntPipe) id: number) {
    // Hủy đặt bàn
    return this.reservationService.cancel(id);
  }

  @Delete(':id')
  deleteLogicReservationById(@Param('id', ParseIntPipe) id: number) {
    // Xóa logic 1 đặt bàn
    return this.reservationService.delete(id);
  }
}
