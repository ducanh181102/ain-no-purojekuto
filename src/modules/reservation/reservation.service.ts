import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderStatus,
  Reservation,
  ReservationStatus,
  TableStatus,
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { TableService } from '../table/table.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { MoveReservationDto } from './dto/move-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

@Injectable()
export class ReservationService {
  // Đưa PrismaService vào để làm việc với database
  constructor(
    private prisma: PrismaService,
    private tableService: TableService,
  ) {}

  // Các phương thức CRUD cho Reservation
  // Lấy tất cả đặt bàn
  async findAll(
    includeTable = false,
    includeOrder = false,
    status?: ReservationStatus,
    tableId?: number,
  ): Promise<Reservation[]> {
    // Khởi tạo biến chưa xóa là 2
    const isDeleted = '2';

    return this.prisma.reservation.findMany({
      where: {
        isDeleted: isDeleted,
        ...(status ? { status } : {}),
        ...(tableId ? { tableId } : {}),
      },
      include: {
        table: includeTable,
        order: includeOrder,
      },
      orderBy: {
        reservedAt: 'asc',
      },
    });
  }

  // Lấy một đặt bàn (kể cả đã xóa) theo ID
  async findOne(id: number): Promise<Reservation | null> {
    return this.prisma.reservation.findUnique({ where: { id } });
  }

  // Lấy Reservation có thông tin
  async findOneOrThrow(id: number): Promise<Reservation> {
    // 1. Tìm reservation
    const reservation = await this.findOne(id);

    // 2. Reservation có tồn tại không
    if (!reservation) {
      throw new NotFoundException('Đặt bàn không tồn tại');
    }

    // 3. Reservation có bị xoá không
    if (reservation.isDeleted === '1') {
      throw new NotFoundException('Đặt bàn đã bị xoá');
    }

    // 4. Trả trị
    return reservation;
  }

  // Lấy đặt bàn đang mở theo tableId
  async findCurrentByTableId(tableId: number): Promise<Reservation> {
    // 1. Kiểm tra bàn có tồn tại
    await this.tableService.checkExist(tableId);

    // 2. Lấy reservation đang giữ bàn
    const reservation = await this.prisma.reservation.findFirst({
      where: {
        tableId,
        status: ReservationStatus.RESERVED,
        isDeleted: '2',
      },
      orderBy: {
        reservedAt: 'asc',
      },
    });

    // 3. Không có thì báo lỗi
    if (!reservation) {
      throw new NotFoundException('Bàn hiện chưa có đặt bàn đang mở');
    }

    // 4. Trả trị
    return reservation;
  }

  // * Tạo mới một đặt bàn
  async create(dto: CreateReservationDto): Promise<Reservation> {
    // 1. Khởi tạo biến cần thiết
    const { tableId, reservedAt, ...rest } = dto;
    const parsedReservedAt = this.parseReservedAt(reservedAt);

    // 2. Kiểm tra xem tableId có tồn tại không
    const table = await this.tableService.findOneOrThrow(tableId);

    // 3. Kiểm tra bàn có đang trống không
    await this.tableService.checkAvailable(tableId);

    // 4. Kiểm tra số khách không vượt sức chứa
    this.checkGuestCount(table.capacity, dto.guestCount);

    // 5. Transaction tạo reservation và cập nhật bàn
    const reservationCreateTrans = await this.prisma.$transaction(async (tx) => {
      // a. Tạo reservation mới
      const reservation = await tx.reservation.create({
        data: {
          ...rest,
          reservedAt: parsedReservedAt,
          table: {
            connect: {
              id: tableId,
            },
          },
        },
      });

      // b. Cập nhật bàn sang RESERVED
      await this.tableService.reserved(tableId, tx);

      // c. Trả về reservation vừa tạo
      return reservation;
    });

    // 6. Trả trị về
    return reservationCreateTrans;
  }

  // Cập nhật một đặt bàn theo ID
  async update(id: number, dto: UpdateReservationDto): Promise<Reservation> {
    // 1. Kiểm tra có tồn tại
    const reservation = await this.findOneOrThrow(id);

    // 2. Kiểm tra reservation còn cho sửa không
    await this.checkStatus(reservation, ReservationStatus.RESERVED);

    // 3. Kiểm tra số khách không vượt sức chứa
    const table = await this.tableService.findOneOrThrow(reservation.tableId);
    this.checkGuestCount(table.capacity, dto.guestCount);

    // 4. Chuẩn bị data
    const data = {
      ...dto,
      ...(dto.reservedAt ? { reservedAt: this.parseReservedAt(dto.reservedAt) } : {}),
    };

    // 5. Cập nhật
    return this.prisma.reservation.update({ where: { id }, data });
  }

  // Xóa logic 1 đặt bàn theo ID
  async delete(id: number): Promise<Reservation> {
    // 1. Kiểm tra có tồn tại
    const reservation = await this.findOneOrThrow(id);

    // 2. Chuẩn bị data
    const isDeleted = '1';
    const deleteAt = new Date();

    // 3. Transaction xóa logic và trả bàn nếu reservation đang giữ bàn
    return this.prisma.$transaction(async (tx) => {
      const deletedReservation = await tx.reservation.update({
        where: { id },
        data: {
          isDeleted,
          deleteAt,
          status: ReservationStatus.CANCELLED,
        },
      });

      if (reservation.status === ReservationStatus.RESERVED) {
        await this.tableService.availableFromReserved(reservation.tableId, tx);
      }

      return deletedReservation;
    });
  }

  // * Nhận bàn: reservation -> order
  async checkIn(id: number) {
    // 1. Kiểm tra reservation
    const reservation = await this.findOneOrThrow(id);

    // 2. Reservation phải đang giữ bàn
    await this.checkStatus(reservation, ReservationStatus.RESERVED);

    // 3. Bàn phải đang là đặt trước
    const table = await this.tableService.findOneOrThrow(reservation.tableId);
    if (table.status !== TableStatus.RESERVED) {
      throw new BadRequestException('Bàn không ở trạng thái đã đặt trước');
    }

    // 4. Transaction tạo order, cập nhật reservation, cập nhật bàn
    return this.prisma.$transaction(async (tx) => {
      // a. Tạo order mới
      const order = await tx.order.create({
        data: {
          status: OrderStatus.PENDING,
          table: {
            connect: {
              id: reservation.tableId,
            },
          },
        },
      });

      // b. Cập nhật trạng thái reservation
      const checkedInReservation = await tx.reservation.update({
        where: { id },
        data: {
          status: ReservationStatus.CHECKED_IN,
          order: {
            connect: {
              id: order.id,
            },
          },
        },
        include: {
          order: true,
          table: true,
        },
      });

      // c. Cập nhật bàn sang OCCUPIED
      await this.tableService.occupied(reservation.tableId, tx);

      // d. Trả trị
      return checkedInReservation;
    });
  }

  // * Đổi bàn đặt trước
  async moveTable(id: number, dto: MoveReservationDto): Promise<Reservation> {
    // 1. Kiểm tra reservation
    const reservation = await this.findOneOrThrow(id);

    // 2. Reservation phải đang giữ bàn
    await this.checkStatus(reservation, ReservationStatus.RESERVED);

    // 3. Không đổi sang chính bàn cũ
    if (reservation.tableId === dto.tableId) {
      throw new BadRequestException('Bàn mới phải khác bàn hiện tại');
    }

    // 4. Kiểm tra bàn mới
    const newTable = await this.tableService.findOneOrThrow(dto.tableId);
    await this.tableService.checkAvailable(dto.tableId);
    this.checkGuestCount(newTable.capacity, reservation.guestCount);

    // 5. Transaction đổi bàn
    return this.prisma.$transaction(async (tx) => {
      // a. Trả bàn cũ về trống
      await this.tableService.availableFromReserved(reservation.tableId, tx);

      // b. Giữ bàn mới
      await this.tableService.reserved(dto.tableId, tx);

      // c. Cập nhật reservation sang bàn mới
      const movedReservation = await tx.reservation.update({
        where: { id },
        data: {
          table: {
            connect: {
              id: dto.tableId,
            },
          },
        },
      });

      // d. Trả trị
      return movedReservation;
    });
  }

  // * Hủy đặt bàn
  async cancel(id: number): Promise<Reservation> {
    // 1. Kiểm tra reservation
    const reservation = await this.findOneOrThrow(id);

    // 2. Reservation phải đang giữ bàn
    await this.checkStatus(reservation, ReservationStatus.RESERVED);

    // 3. Transaction hủy reservation và trả bàn về trống
    return this.prisma.$transaction(async (tx) => {
      // a. Cập nhật reservation sang CANCELLED
      const cancelledReservation = await tx.reservation.update({
        where: { id },
        data: {
          status: ReservationStatus.CANCELLED,
        },
      });

      // b. Cập nhật bàn sang AVAILABLE
      await this.tableService.availableFromReserved(reservation.tableId, tx);

      // c. Trả trị
      return cancelledReservation;
    });
  }

  // ^ Kiểm tra trạng thái reservation có hợp lệ
  async checkStatus(
    reservation: Reservation | null,
    status: ReservationStatus,
    valid = true,
  ): Promise<void> {
    // Trường hợp không hợp lệ
    if (
      (!valid && reservation?.status === status) ||
      (valid && reservation?.status !== status)
    ) {
      throw new BadRequestException('Trạng thái đặt bàn không hợp lệ');
    }
  }

  // ^ Kiểm tra số khách không vượt sức chứa bàn
  private checkGuestCount(capacity?: number | null, guestCount?: number | null): void {
    if (capacity && guestCount && guestCount > capacity) {
      throw new BadRequestException('Số khách vượt quá sức chứa của bàn');
    }
  }

  // ^ Chuyển chuỗi ngày giờ thành Date
  private parseReservedAt(value: string): Date {
    const reservedAt = new Date(value);

    if (Number.isNaN(reservedAt.getTime())) {
      throw new BadRequestException('Thời gian đặt bàn không hợp lệ');
    }

    return reservedAt;
  }
}
