import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Order, OrderItem, OrderItemStatus, OrderStatus, Payment, PaymentStatus, Prisma } from '@prisma/client';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { TableService } from '../table/table.service';
import { OrderItemService } from '../orderitem/order-item.service';
import { PaymentService } from '../payment/payment.service';
import { CreatePaymentOrderDto } from './dto/create-payment-order.dto';

@Injectable()
export class OrderService {
  // Đưa PrismaService vào để làm việc với database
  constructor(
    private prisma: PrismaService,
    private tableService: TableService,
    @Inject(forwardRef(() => OrderItemService))
    private orderItemService: OrderItemService,
    private paymentService: PaymentService,
  ) {}

  // Các phương thức CRUD cho Order
  // Lấy tất cả đơn hàng
  async findAll(includeTable = false): Promise<Order[]> {
    // Khởi tạo biến chưa xóa là 2
    const isDeleted = '2';
    return this.prisma.order.findMany({
      where: {
        isDeleted: isDeleted,
      },
      include: {
        table: includeTable,
      },
    });
  }

  // Lấy một đơn hàng (kể cả đã xóa) theo ID
  async findOne(id: number): Promise<Order | null> {
    return this.prisma.order.findUnique({ where: { id } });
  }

  // Lấy đơn hàng có thông tin
  async findOneOrThrow(id: number): Promise<Order> {
    // 1. Tìm đơn hàng
    const order = await this.findOne(id);

    // 2. Đơn hàng có tồn tại không
    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    // 3. Đơn hàng có bị xoá không
    if (order.isDeleted === '1') {
      throw new NotFoundException('Đơn hàng đã bị xoá');
    }

    // 4. Trả trị
    return order;
  } 

  // Lấy đơn hàng có thông tin
  async findCurrentOrderId(tableId: number): Promise<number> {
    const order = await this.prisma.order.findFirst({
      where: {
        tableId,
        status: {
          notIn: ['PAID', 'CANCELLED'],
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Bàn hiện chưa có order đang mở');
    }

    return order.id;
  }

  // * Tạo mới một đơn hàng
  async create(dto: CreateOrderDto): Promise<Order> {
    // 1. Khởi tạo biến cần thiết
    // kỹ thuật phân rã obj
    const { tableId, ...rest } = dto;

    // 2. Kiểm tra xem tableId có tồn tại trong bảng table hay không
    await this.tableService.checkExist(tableId);

    // 3. Kiểm tra bàn có đang trống không
    await this.tableService.checkAvailable(tableId);

    // 4. Transaction (tạo order, cập nhật bàn)
    const orderCreateTrans = await this.prisma.$transaction(async (tx) => {
      // a. Tạo biến data để setting vào
      const data = {
        ...rest,
        table: {
          connect: {
            id: tableId,
          },        
        },
      };

      // b. Tạo Order mới
      const order = await tx.order.create({ data: data });

      // c. Cập nhật bàn sang OCCUPIED
      await this.tableService.occupied(tableId, tx);

      // d. Trả về order vừa tạo
      return order;
    });

    // 7. Trả trị về
    return orderCreateTrans;
  }

  // Cập nhật một đơn hàng theo ID
  async update(id: number, dto: UpdateOrderDto, tx?: Prisma.TransactionClient): Promise<Order> {
    // 1. Tạo biến client
    const client = tx ?? this.prisma;
    // 2. Trả trị
    return client.order.update({ where: { id }, data: dto });
  }

  // Xóa logic 1 đơn hàng theo ID
  async delete(id: number): Promise<Order> {
    // Tạo biến đã xóa là 1
    const isDeleted = '1';
    // Tạo biến ngày xóa
    const deleteAt = new Date();
    // Tạo biến data chứa thông tin fields
    const data = {
      isDeleted: isDeleted,
      deleteAt: deleteAt,
    };
    const [order] = await this.prisma.$transaction([
      // xóa logic đơn hàng
      this.prisma.order.update({
        where: { id },
        data: data,
      }),
      // xóa logic từng chi tiết đơn hàng thuộc đơn hàng này
      this.prisma.orderItem.updateMany({
        where: { orderId: id },
        data: data,
      }),
    ]);
    return order;
  }

  // Xóa một đơn hàng theo ID
  async remove(id: number): Promise<Order> {
    return this.prisma.order.delete({ where: { id } });
  }

  // ^ Kiểm tra xem order có idOrder có đang tồn tại
  async checkExist(id: number): Promise<void> {
    // Gán giá trị cho biến order
    const order = await this.findOne(id);

    // Trường hợp không có data hoặc đã xoá
    if (!order || '1' === order.isDeleted) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }
  }

  // ^ Kiểm tra xem order có trạng thái có hợp lệ
  async checkStatus(order: Order | null, status: OrderStatus, valid = true): Promise<void> {
    // Trường hợp không hợp lệ
    if ((!valid && order?.status === status) || (valid && order?.status !== status)) {
      throw new BadRequestException('Trạng thái của đơn hàng không hợp lệ');
    }
  }

  // * Thanh toán đơn hàng
  async pay(id: number, dto: CreatePaymentOrderDto): Promise<Payment> {
    // 1. Chuẩn bị data
    // a. Danh sách trạng thái không phù hợp
    const validStatuses = [
      OrderStatus.PENDING,
      OrderStatus.PAID,
      OrderStatus.CANCELLED,
    ]

    // 2. Kiểm tra có tồn tại
    await this.checkExist(id)

    // 3. Tìm order theo id
    const order = await this.findOne(id);

    // 4. Kiểm tra trạng thái hiện tại có đang là huỷ hoặc đã thanh toán
    for (const status of validStatuses) {
      // a. Tạo biến là không hợp lệ
      const valid = false;
      // b. Xử lý kiểm tra có là trạng thái không phù hợp
      await this.checkStatus(order, status, valid);
    }

    // 5. Cập nhật thông tin vào data
    // a. Tính tổng tiền từ orderItems
    const total = await this.orderItemService.calculateToTalAmount(id);
    // b. Xử lý xác nhận thanh toán thành công từ bên thứ 3
    // TODO
    const status = PaymentStatus.SUCCESS;
    // b. Cập nhật thông tin
    const data = {
      ...dto,
      orderId: id,
      amount: total,
      status: status,
    }

    // 6. Xử lý transaction Tạo Payment -> Cập nhật Order -> Cập nhật Table
    const payment = await this.prisma.$transaction(async (tx) => {
      // a. Xử lý tạo payment
      const createPayment = await this.paymentService.create(data, tx);
      // b. Xử lý cập nhật trạng thái Order thành đã thanh toán
      await this.paid(id, tx)
      // c. Xử lý cập nhật trạng thái bàn thành có sẵn
      // Khởi tạo tableId
      const tableId = order?.tableId;
      // Kiểm tra, nếu tableId không có trị thì xuất ra exception
      if (!tableId) {
        throw new NotFoundException('Mã bàn không hợp lệ');
      }
      // Xử lý cập nhật trạng thái bàn thành có sẵn
      await this.tableService.available(tableId, tx);
      // d. Trả payment vừa tạo
      return createPayment;
    }) 

    // 7. Trả về payment vừa tạo
    return payment;
  }
  
  // * Chuyển trạng thái cho đơn hàng là vừa chọn món
  async pending(id: number, tx?: Prisma.TransactionClient): Promise<void> {
    // 1. Chuẩn bị data
    const data = {
      status: OrderStatus.PENDING,
    }

    // 2. Kiểm tra có tồn tại
    await this.checkExist(id)

    // 3. Cập nhật status sang PENDING
    await this.update(id, data, tx)
  }

  // * Chuyển trạng thái cho đơn hàng là đã xác nhận
  async confirm(id: number): Promise<void> {
    // 1. Chuẩn bị data
    const data = {
      status: OrderStatus.CONFIRMED,
    }

    // 2. Kiểm tra có tồn tại
    await this.checkExist(id)

    // 3. Tạo cờ kiểm tra tất cả món trong đơn đã được xác nhận hết chưa
    const isAllConfirmedFlg = await this.checkAllConfirmed(id);

    // 4. Cập nhật status sang CONFIRMED
    if (isAllConfirmedFlg) {
      await this.update(id, data);
    } 
  }

  // * Chuyển trạng thái cho đơn hàng là đang chuẩn bị
  async preparing(id: number): Promise<void> {
    // 1. Chuẩn bị data
    const data = {
      status: OrderStatus.PREPARING,
    }

    // 2. Kiểm tra có tồn tại
    await this.checkExist(id)

    // 3. Cập nhật status sang COOKING
    await this.update(id, data);
  }

  // * Chuyển trạng thái cho đơn hàng là đã thanh toán
  async paid(id: number, tx?: Prisma.TransactionClient): Promise<Order> {
    // 1. Chuẩn bị data
    const data = {
      status: OrderStatus.PAID,
    }

    // 2. Kiểm tra có tồn tại
    await this.checkExist(id)

    // 3. Cập nhật status sang là đã thanh toán
    const updateOrder = await this.update(id, data, tx)

    // 4. Trả về orderItem đã cập nhật
    return updateOrder;
  }

  // * Chuyển trạng thái cho đơn hàng là đã phục vụ
  async served(id: number): Promise<void> {
    // 1. Chuẩn bị data
    const data = {
      status: OrderStatus.SERVED,
    }

    // 2. Kiểm tra có tồn tại
    await this.checkExist(id)

    // 3. Tạo cờ kiểm tra tất cả món trong đơn đã được phục vụ hết chưa
    const isAllServedFlg = await this.checAllServed(id);

    // 4. Cập nhật status sang SERVED
    if (isAllServedFlg) {
      await this.update(id, data);
    } 
  }

  // * Chuyển trạng thái cho đơn hàng là đã xoá
  async cancelled(id: number): Promise<void> {
    // 1. Chuẩn bị data
    const data = {
      status: OrderStatus.CANCELLED,
    }

    // 2. Kiểm tra có tồn tại
    await this.checkExist(id)

    // 3. Tạo cờ kiểm tra tất cả món trong đơn đã được xoá hết chưa
    const isAllCancelledFlg = await this.checAllCancelled(id);

    // 4. Cập nhật status sang CANCELLED
    if (isAllCancelledFlg) {
      // a. Transaction thực thi luồng Cập nhật trạng thái đơn -> Cập nhật trạng thái bàn
      await this.prisma.$transaction(async (tx) => {
        // Cập nhật status đơn sang đã huỷ
        const order = await this.update(id, data);
        // Tạo biến tableId
        const tableId = order?.tableId;
        // Kiểm tra
        if (!tableId) {
            throw new BadRequestException('tableId không hợp lệ');
        }
        // Cập nhật trạng thái bàn
        await this.tableService.available(order.tableId, tx);
        // Trả trị
        return order;
      });
    } 
  }

  // * Huỷ đơn (ngay khi vừa tạo)
  async cancel(id: number): Promise<Order> {
    // 1. Chuẩn bị data
    const data = {
      status: OrderStatus.CANCELLED,
    }

    // 2. Kiểm tra có tồn tại
    await this.checkExist(id)

    // 3. Tìm order theo id
    const order = await this.findOne(id);

    // 4. Kiểm tra trạng thái hiện tại phải là đã nấu
    await this.checkStatus(order, OrderStatus.PENDING);

    // 5. Transaction thực thi luồng Cập nhật trạng thái đơn -> Cập nhật trạng thái bàn
    const updateOrder = await this.prisma.$transaction(async (tx) => {
      // a. Cập nhật status đơn sang đã huỷ
      const order = await this.update(id, data);
      // b. Kiểm tra tableId
      // Tạo biến tableId
      const tableId = order?.tableId;
      // Kiểm tra
      if (!tableId) {
          throw new BadRequestException('tableId không hợp lệ');
      }
      // c. Cập nhật trạng thái bàn
      await this.tableService.available(order.tableId, tx);
      
      // d. Trả trị
      return order;
    });

    // 7. Trả về order đã cập nhật
    return updateOrder;
  }

  // * Kiểm tra trong đơn hàng: tất cả các món đều là confirm
  async checkAllConfirmed(id: number, tx?: Prisma.TransactionClient): Promise<boolean> {
    // 1. Tạo biến valid để lấy món không theo status
    const valid = false;

    // 2. Kiểm tra có tồn tại
    await this.checkExist(id)

    // 3. Lấy danh sách các món trong đơn hàng chưa được xác nhận
    const orderItems = await this.orderItemService.findByOrderId(id, OrderItemStatus.CONFIRMED, valid)

    // 4. Cờ đánh dấu tất cả món đã được xác nhận
    const isAllConfirmedFlag = orderItems.length === 0;

    // 5. Trả trị
    return isAllConfirmedFlag;
  }

  // * Kiểm tra trong đơn hàng: tất cả các món đều là SERVED
  async checAllServed(id: number, tx?: Prisma.TransactionClient): Promise<boolean> {
    // 1. Tạo biến valid để lấy món không theo status
    const valid = false;

    // 2. Kiểm tra có tồn tại
    await this.checkExist(id)

    // 3. Lấy danh sách các món trong đơn hàng chưa served
    const orderItems = await this.orderItemService.findByOrderId(id, OrderItemStatus.SERVED, valid)

    // 4. Cờ đánh dấu tất cả món đã được served
    const isAllServedFlg = orderItems.length === 0;

    // 5. Trả trị
    return isAllServedFlg;
  }

  // * Kiểm tra trong đơn hàng: tất cả các món đều là CANCELLED
  async checAllCancelled(id: number, tx?: Prisma.TransactionClient): Promise<boolean> {
    // 1. Tạo biến valid để lấy món không theo status
    const valid = false;

    // 2. Kiểm tra có tồn tại
    await this.checkExist(id)

    // 3. Lấy danh sách các món trong đơn hàng chưa cancelled
    const orderItems = await this.orderItemService.findByOrderId(id, OrderItemStatus.CANCELLED, valid)

    // 4. Cờ đánh dấu tất cả món đã được xoá
    const isAllCancelledFlg = orderItems.length === 0;

    // 5. Trả trị
    return isAllCancelledFlg;
  }

  // * Kiểm tra đơn hàng còn cho phép thao tác: tức là chưa paid hoặc chưa canceled
  async checkOrderCanUpdateItem(id: number, tx?: Prisma.TransactionClient): Promise<void> {
    // 1. Chuẩn bị data
    // a. Tạo biến valid để lấy món không theo status
    const valid = false;
    // b. Danh sách trạng thái không phù hợp
    const validStatuses = [
      OrderStatus.PAID,
      OrderStatus.CANCELLED,
    ]

    // 2. Kiểm tra có tồn tại
    await this.checkExist(id)

    // 3. Tìm order theo id
    const order = await this.findOne(id);

    // 4. Kiểm tra trạng thái hiện tại có đang là huỷ hoặc đã thanh toán
    for (const status of validStatuses) {
      // a. Xử lý kiểm tra có là trạng thái không phù hợp
      await this.checkStatus(order, status, valid);
    }
  }
}
