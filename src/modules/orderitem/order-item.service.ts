import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { OrderItem, OrderItemStatus, OrderStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { DishService } from '../dish/dish.service';
import { OrderService } from '../order/order.service';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';

@Injectable()
export class OrderItemService {
  // Đưa PrismaService vào để làm việc với database
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => OrderService))
    private orderService: OrderService,
    private dishService: DishService,
  ) { }

  // Các phương thức CRUD cho OrderItem
  // Lấy tất cả chi tiết đơn hàng
  async findAll(includeOrder = false, includeDish = false): Promise<OrderItem[]> {
    // Khởi tạo biến chưa xóa là 2
    const isDeleted = '2';
    return this.prisma.orderItem.findMany({
      where: {
        isDeleted: isDeleted,
      },
      include: {
        order: includeOrder,
        dish: includeDish,
      }
    });
  }

  // Các phương thức CRUD cho OrderItem
  // Lấy tất cả chi tiết đơn hàng
  async findAllByOrder(
    orderId: number,
    includeOrder = false,
    includeDish = false): Promise<OrderItem[]> {
    // Khởi tạo biến chưa xóa là 2
    const isDeleted = '2';
    return this.prisma.orderItem.findMany({
      where: {
        isDeleted: isDeleted,
        order: {
          id: orderId,
        },
      },
      include: {
        order: includeOrder,
        dish: includeDish,
      }
    });
  }

  // Lấy tổng tiền chi tiết đơn hàng theo orderId
  async getTotalAmountByOrder(orderId: number): Promise<{ orderId: number; total: number }> {
    // 1. Kiểm tra order có tồn tại
    await this.orderService.checkExist(orderId);

    // 2. Tính tổng tiền các món trong order
    const total = await this.calculateToTalAmount(orderId);

    // 3. Trả về orderId và tổng tiền
    return {
      orderId,
      total,
    };
  }

  // Lấy các món trong đơn hàng theo trạng thái
  async findByOrderId(orderId: number, status: OrderItemStatus, valid = true): Promise<OrderItem[]> {
    // 1. Lấy thông tin orderItems
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        orderId,
        isDeleted: '2',
        status: valid ? status : {
          notIn: [
            status,
            OrderItemStatus.CANCELLED,
          ]
        }
      }
    });

    // 2. Trả trị
    return orderItems;
  }

  // Lấy một chi tiết đơn hàng (kể cả đã xóa) theo ID
  async findOne(id: number): Promise<OrderItem | null> {
    return this.prisma.orderItem.findUnique({ where: { id } });
  }

  // Lấy OrderItem có thông tin
  async findOneOrThrow(id: number): Promise<OrderItem> {
    // 1. Tìm OrderItem
    const orderItem = await this.findOne(id);

    // 2. OrderItem có tồn tại không
    if (!orderItem) {
      throw new NotFoundException('OrderItem không tồn tại');
    }

    // 3. OrderItem có bị xoá không
    if (orderItem.isDeleted === '1') {
      throw new NotFoundException('OrderItem đã bị xoá');
    }

    // 4. Trả trị
    return orderItem;
  }

  // * Tạo mới một chi tiết đơn hàng
  async create(dto: CreateOrderItemDto): Promise<OrderItem> {
    // 1. Chuẩn bị data
    // a. Kỹ thuật phân rã obj
    const {
      dishId,
      orderId,
      ...rest
    } = dto
    // b. Tạo biến data để setting vào 
    let data = {
      ...rest,
      price: 1,
      dish: {
        connect: {
          id: dishId,
        },
      },
      order: {
        connect: {
          id: orderId,
        },
      },
    };
    // c. Tạo biến danh sách trạng thái đơn hàng không phù hợp
    const validStatuses = [
      OrderStatus.CANCELLED,
      OrderStatus.PAID,
    ];

    // 2. Kiểm tra orderId có tồn tại
    await this.orderService.checkExist(orderId);

    // 3. Lấy thông tin order
    const order = await this.orderService.findOne(orderId);

    // 4. Kiểm tra trạng thái order (chưa thanh toán hoặc chưa huỷ)
    for (const status of validStatuses) {
      // Khởi tạo biến valid: 
      // true - Kiểm tra hợp lệ
      // false - Kiểm tra không hợp lệ
      const valid = false
      // a. Gọi service kiểm tra trạng thái đơn hàng
      await this.orderService.checkStatus(order, status, valid);
    }

    // 5. Kiểm tra món có tồn tại
    await this.dishService.checkExist(dishId);

    // 6. Lấy thông tin dish
    const dish = await this.dishService.findOne(dishId);

    // 7. Kiểm tra món còn bán không
    await this.dishService.checkAvailable(dish);

    // 8. Setting giá mới vào data
    // a. Lấy giá mới nhất từ table Dish
    const newPrice = dish?.price;
    // b. Kiểm tra giá trị hợp lệ
    if (!newPrice || 1 > newPrice) {
      throw new BadRequestException('Giá không hợp lệ');
    }
    // c. Setting vào data
    data = {
      ...data,
      price: newPrice,
    }

    // 9. Transaction thực thi luồng Thêm chi tiết đơn hàng -> Cập nhật trạng đơn hàng
    const createOrderItem = await this.prisma.$transaction(async (tx) => {
      // a. Thêm chi tiết đơn hàng
      const orderItem = await this.prisma.orderItem.create({ data: data });

      // b. Cập nhật trạng thái đơn hàng thành vừa mới thêm món
      await this.orderService.pending(orderId, tx);

      // c. Trả trị
      return orderItem;
    });

    // 10. Trả về món vừa gọi
    return createOrderItem
  }

  // Cập nhật một chi tiết đơn hàng theo ID
  async update(id: number, dto: UpdateOrderItemDto): Promise<OrderItem> {
    return this.prisma.orderItem.update({ where: { id }, data: dto });
  }

  // Xóa logic 1 chi tiết đơn hàng theo ID
  async delete(id: number): Promise<OrderItem> {
    // Tạo biến đã xóa là 1
    const isDeleted = '1';
    // Tạo biến ngày xóa
    const deleteAt = new Date();
    // Tạo biến data chứa thông tin fields
    const data = {
      isDeleted: isDeleted,
      deleteAt: deleteAt,
    }
    return this.prisma.orderItem.update({ where: { id }, data: data })
  }

  // Xóa một chi tiết đơn hàng theo ID
  async remove(id: number): Promise<OrderItem> {
    return this.prisma.orderItem.delete({ where: { id } });
  }

  // ^ Kiểm tra đối tượng có đang tồn tại
  async checkExist(id: number): Promise<void> {
    // Gán giá trị cho biến orderItem
    const orderItem = await this.findOne(id);

    // Trường hợp không có data hoặc đã xoá
    if (!orderItem || '1' === orderItem.isDeleted) {
      throw new NotFoundException('Không tìm thấy chi tiết đơn hàng');
    }
  }

  // ^ Kiểm tra xem đối tượng có trạng thái hợp lệ
  async checkStatus(orderItem: OrderItem | null, status: OrderItemStatus, valid = true): Promise<void> {
    // Kiểm tra
    if ((valid && orderItem?.status !== status) || (!valid && orderItem?.status === status)) {
      throw new BadRequestException('Trạng thái của chi tiết đơn hàng không hợp lệ');
    }
  }

  // * Xác nhận chi tiết đơn hàng
  async confirm(id: number): Promise<OrderItem> {
    // 1. Chuẩn bị data
    const data = {
      status: OrderItemStatus.CONFIRMED,
    }

    // 2. Kiểm tra có tồn tại
    await this.checkExist(id)

    // 3. Tìm orderItem theo id
    const orderItem = await this.findOne(id);

    // 4. Kiểm tra đơn hàng có còn thao tác được
    // a. Khởi tạo orderId
    const orderId = orderItem?.orderId;
    // b. Kiểm tra, nếu orderId không có trị thì xuất ra exception
    if (!orderId) {
      throw new NotFoundException('Mã đơn không hợp lệ');
    }
    // c. Check đơn hàng có còn thao tác được không
    await this.orderService.checkOrderCanUpdateItem(orderId);

    // 5. Kiểm tra trạng thái hiện tại phải là PENDING
    await this.checkStatus(orderItem, OrderItemStatus.PENDING);

    // 6. Cập nhật status món sang CONFIRMED
    const updateOrderItem = await this.update(id, data)

    // 7. Cập nhật status đơn sang CONFIRMED
    // a. Kiểm tra orderID có trị
    if (!orderId) {
      throw new BadRequestException('orderId không mang giá trị');
    }
    // b. Cập nhật status
    await this.orderService.confirm(orderId);

    // 8. Trả về orderItem đã cập nhật
    return updateOrderItem;
  }

  // * Chuyển trạng thái cho chi tiết đơn hàng là đang nấu
  async cooking(id: number): Promise<OrderItem> {
    // 1. Chuẩn bị data
    const data = {
      status: OrderItemStatus.COOKING,
    }

    // 2. Kiểm tra có tồn tại
    await this.checkExist(id)

    // 3. Tìm orderItem theo id
    const orderItem = await this.findOne(id);

    // 4. Kiểm tra đơn hàng có còn thao tác được
    // a. Khởi tạo orderId
    const orderId = orderItem?.orderId;
    // b. Kiểm tra, nếu orderId không có trị thì xuất ra exception
    if (!orderId) {
      throw new NotFoundException('Mã đơn không hợp lệ');
    }
    // c. Check đơn hàng có còn thao tác được không
    await this.orderService.checkOrderCanUpdateItem(orderId);

    // 5. Kiểm tra trạng thái hiện tại là đã xác nhận
    await this.checkStatus(orderItem, OrderItemStatus.CONFIRMED);

    // 6. Cập nhật status sang là đã nấu
    const updateOrderItem = this.update(id, data)

    // 7. Cập nhật status đơn sang PREPARING
    // a. Kiểm tra orderID có trị
    if (!orderId) {
      throw new BadRequestException('orderId không mang giá trị');
    }
    // b. Cập nhật status
    await this.orderService.preparing(orderId);

    // 8. Trả về orderItem đã cập nhật
    return updateOrderItem;
  }

  // * Chuyển trạng thái cho chi tiết đơn hàng là đã nấu
  async ready(id: number): Promise<OrderItem> {
    // 1. Chuẩn bị data
    const data = {
      status: OrderItemStatus.READY,
    }

    // 2. Kiểm tra có tồn tại
    await this.checkExist(id)

    // 3. Tìm orderItem theo id
    const orderItem = await this.findOne(id);

    // 4. Kiểm tra đơn hàng có còn thao tác được
    // a. Khởi tạo orderId
    const orderId = orderItem?.orderId;
    // b. Kiểm tra, nếu orderId không có trị thì xuất ra exception
    if (!orderId) {
      throw new NotFoundException('Mã đơn không hợp lệ');
    }
    // c. Check đơn hàng có còn thao tác được không
    await this.orderService.checkOrderCanUpdateItem(orderId);

    // 5. Kiểm tra trạng thái hiện tại là COOKING
    await this.checkStatus(orderItem, OrderItemStatus.COOKING);

    // 6. Cập nhật status sang là đã nấu
    const updateOrderItem = this.update(id, data)

    // 7. Trả về orderItem đã cập nhật
    return updateOrderItem;
  }

  // * Chuyển trạng thái cho chi tiết đơn hàng là đã phục vụ
  async served(id: number): Promise<OrderItem> {
    // 1. Chuẩn bị data
    const data = {
      status: OrderItemStatus.SERVED,
    }

    // 2. Kiểm tra có tồn tại
    await this.checkExist(id)

    // 3. Tìm orderItem theo id
    const orderItem = await this.findOne(id);

    // 4. Kiểm tra đơn hàng có còn thao tác được
    // a. Khởi tạo orderId
    const orderId = orderItem?.orderId;
    // b. Kiểm tra, nếu orderId không có trị thì xuất ra exception
    if (!orderId) {
      throw new NotFoundException('Mã đơn không hợp lệ');
    }
    // c. Check đơn hàng có còn thao tác được không
    await this.orderService.checkOrderCanUpdateItem(orderId);

    // 5. Kiểm tra trạng thái hiện tại phải là đã nấu
    await this.checkStatus(orderItem, OrderItemStatus.READY);

    // 6. Cập nhật status món sang là đã phục vụ
    const updateOrderItem = await this.update(id, data)

    // 7. Cập nhật status đơn sang SERVED
    // a. Kiểm tra orderID có trị
    if (!orderId) {
      throw new BadRequestException('orderId không mang giá trị');
    }
    // b. Cập nhật status
    await this.orderService.served(orderId);

    // 8. Trả về orderItem đã cập nhật
    return updateOrderItem;
  }

  // * Chuyển trạng thái cho chi tiết đơn hàng là huỷ
  async cancel(id: number): Promise<OrderItem> {
    // 1. Chuẩn bị data
    // a. Chuẩn bị data
    const data = {
      status: OrderItemStatus.CANCELLED,
    }
    // b. Tạo biến danh sách trạng thái đơn hàng không phù hợp
    const validStatuses = [
      OrderItemStatus.CANCELLED,
      OrderItemStatus.COOKING,
      OrderItemStatus.READY,
      OrderItemStatus.SERVED,
      OrderItemStatus.CONFIRMED,
    ];

    // 2. Kiểm tra có tồn tại
    await this.checkExist(id)

    // 3. Tìm orderItem theo id
    const orderItem = await this.findOne(id);

    // 4. Kiểm tra đơn hàng có còn thao tác được
    // a. Khởi tạo orderId
    const orderId = orderItem?.orderId;
    // b. Kiểm tra, nếu orderId không có trị thì xuất ra exception
    if (!orderId) {
      throw new NotFoundException('Mã đơn không hợp lệ');
    }
    // c. Check đơn hàng có còn thao tác được không
    await this.orderService.checkOrderCanUpdateItem(orderId);

    // 5. Kiểm tra trạng thái hiện tại phải là mới tạo
    for (const status of validStatuses) {
      // a. Tạo biến valid
      const valid = false;
      // b. Xử lý kiểm tra có là trạng thái không phù hợp
      await this.checkStatus(orderItem, status, valid);
    }

    // 6. Cập nhật status sang là huỷ
    const updateOrderItem = this.update(id, data)

    // 7. Cập nhật status đơn sang CANCELLED
    // a. Kiểm tra orderID có trị
    if (!orderId) {
      throw new BadRequestException('orderId không mang giá trị');
    }
    // b. Cập nhật status
    await this.orderService.cancelled(orderId);

    // 8. Trả về orderItem đã cập nhật
    return updateOrderItem;
  }

  // * Tính tổng chi tiết đơn hàng theo orderId
  async calculateToTalAmount(orderId: number): Promise<number> {
    // 1. Lấy thông tin orderItems
    // a. Tạo biến valid
    // true: lấy món theo trạng thái
    // fasle: lấy món mà không theo trạng thái
    const valid = false;
    // b. Lấy thông tin các món
    const orderItems = await this.findByOrderId(orderId, OrderItemStatus.CANCELLED, valid);

    // 2. Tính tổng
    const total = orderItems.reduce((total, item) => {
      // Trả về kết quả tính được sau mỗi vòng
      return total + item.price * item.quantity;
    }, 0);

    // Trả kết quả
    return total;
  }
}
