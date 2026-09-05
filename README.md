## BUILD PROJECT
- docker compose up -d
- npm run start:dev

## NOTE
- Các methods có gắn * là methods liên quan đến luồng nghiệp vụ
- Các methods có gắn ^ là methods common

## RULES CODING
1. Tuần thủ mỗi dòng code đều phải có comment
2. Mỗi service sẽ đảm nhận làm việc với DB của table liên quan. Nếu muốn làm việc với table khác với service đang coding thì phải gọi xử lý từ service tương ứng với table đó. Ví dụ: Tạo đơn hàng có xử lý update trạng thái bàn, thì phải viết xử lý update bàn từ service Table rồi gọi sang.
3. Quy tắc đặt tên
- Route
+ Dùng [resource + id + action]
+ Ví dụ: PATCH /order-items/:id/confirm

- Controller method
+ Dùng [action + domain object]
+ Ví dụ: confirmOrderItem()

- Service method
+ Dùng [action] ngắn gọn
+ Ví dụ: confirm()

- Module
+ Theo [domain]
+ Ví dụ: OrderItemModule

- Biến
+ Id: [đối tượng + Id]. Ví dụ: orderId <TH: Parameters chỉ có 1 biến id thì [id]>
+ Record lấy từ database dùng [tên đối tượng]. Ví dụ: order
+ Biến boolean: [is + hành động]. Ví dụ: isVailable
+ Mảng hoặc list danh sách: [đối tượng + s]. Ví dụ orders

## NGHIỆP VỤ HỆ THỐNG

### 1. Quản lý danh mục món ăn

Admin hoặc nhân viên có quyền quản lý danh mục món ăn.

Luồng xử lý:
- Tạo danh mục món ăn
- Cập nhật tên danh mục
- Xóa mềm danh mục
- Khi xóa danh mục, các món thuộc danh mục đó cũng cần được xử lý phù hợp

Ví dụ danh mục:
- Ốc
- Sò
- Nghêu
- Hàu
- Lẩu
- Đồ uống

---

### 2. Quản lý món ăn

Admin hoặc nhân viên tạo và quản lý menu món ăn.

Luồng xử lý:
- Tạo món ăn
- Gán món ăn vào danh mục
- Cập nhật tên món, giá, hình ảnh
- Cập nhật trạng thái còn bán / ngừng bán
- Xóa mềm món ăn

Quy tắc:
- Món ăn đã ngừng bán thì khách không được gọi món
- Giá món khi gọi phải lấy từ database, không lấy từ client gửi lên

---

### 3. Quản lý bàn

Nhân viên quản lý trạng thái bàn trong quán.

Trạng thái bàn:
- AVAILABLE: bàn trống
- OCCUPIED: bàn đang có khách
- RESERVED: bàn đã được đặt trước

Luồng xử lý:
- Tạo bàn
- Cập nhật thông tin bàn
- Đặt bàn trước
- Mở bàn khi khách vào
- Khi tạo order thành công, bàn chuyển sang OCCUPIED
- Khi thanh toán thành công, bàn chuyển về AVAILABLE

---

### 4. Mở đơn hàng

Khi khách bắt đầu gọi món, hệ thống tạo một order cho bàn.

Luồng xử lý:
- Nhận tableId
- Kiểm tra bàn có tồn tại không
- Kiểm tra bàn chưa bị xóa mềm
- Kiểm tra bàn đang AVAILABLE
- Tạo order mới
- Cập nhật bàn sang OCCUPIED

Trạng thái order ban đầu:
- PENDING

Quy tắc:
- Một bàn đang OCCUPIED không được mở thêm order mới nếu order cũ chưa thanh toán
- Việc tạo order và cập nhật bàn phải nằm trong transaction

---

### 5. Gọi món

Khách hoặc nhân viên thêm món vào order.

Luồng xử lý:
- Nhận orderId, dishId, quantity, note
- Kiểm tra order có tồn tại không
- Kiểm tra order chưa bị xóa mềm
- Kiểm tra order chưa thanh toán hoặc chưa hủy
- Kiểm tra món ăn có tồn tại không
- Kiểm tra món ăn còn bán
- Lấy giá hiện tại của món từ database
- Tạo orderItem

Trạng thái orderItem ban đầu:
- PENDING

Quy tắc:
- Không nhận giá món từ client
- Chỉ cho gọi món khi order còn hợp lệ
- Nếu món hết bán thì không được thêm vào order
- Quantity phải lớn hơn 0

---

### 6. Nhân viên xác nhận món

Sau khi khách gọi món, nhân viên xác nhận món trước khi chuyển cho bếp.

Luồng xử lý:
- Nhận orderItemId
- Kiểm tra orderItem có tồn tại không
- Kiểm tra orderItem chưa bị xóa mềm
- Kiểm tra trạng thái hiện tại là PENDING
- Cập nhật trạng thái sang CONFIRMED

Quy tắc trạng thái:
- PENDING -> CONFIRMED: hợp lệ
- Các trạng thái khác không được confirm lại

---

### 7. Bếp chế biến món

Bếp xử lý từng món trong order.

Luồng xử lý:
- Món đã CONFIRMED thì bếp bắt đầu làm
- Cập nhật trạng thái sang COOKING
- Khi làm xong, cập nhật trạng thái sang READY

Quy tắc trạng thái:
- CONFIRMED -> COOKING
- COOKING -> READY

---

### 8. Phục vụ món

Nhân viên phục vụ món đã hoàn thành ra bàn.

Luồng xử lý:
- Nhận orderItemId
- Kiểm tra orderItem đang READY
- Cập nhật trạng thái sang SERVED

Quy tắc trạng thái:
- READY -> SERVED
- Chỉ món READY mới được phục vụ

---

### 9. Hủy món

Khách hoặc nhân viên có thể hủy món trong điều kiện phù hợp.

Luồng xử lý:
- Nhận orderItemId
- Kiểm tra orderItem tồn tại
- Kiểm tra trạng thái hiện tại
- Nếu món chưa chế biến thì cho hủy
- Cập nhật trạng thái sang CANCELLED

Quy tắc:
- PENDING -> CANCELLED: hợp lệ
- CONFIRMED -> CANCELLED: có thể cho phép nếu bếp chưa làm
- COOKING, READY, SERVED: không nên cho hủy

---

### 10. Thanh toán

Khi khách yêu cầu tính tiền, nhân viên tạo thanh toán cho order.

Luồng xử lý:
- Nhận orderId
- Kiểm tra order tồn tại
- Kiểm tra order chưa thanh toán
- Tính tổng tiền từ các orderItem chưa bị hủy
- Tạo payment
- Cập nhật payment status
- Nếu thanh toán thành công:
  - Order chuyển sang PAID
  - Table chuyển sang AVAILABLE

Quy tắc:
- Không tính tiền các món đã CANCELLED
- Không cho thanh toán order đã PAID
- Thanh toán thành công phải nằm trong transaction với cập nhật order và table

---

### 11. Hủy đơn hàng

Nhân viên hoặc admin có thể hủy cả order nếu order chưa thanh toán.

Luồng xử lý:
- Nhận orderId
- Kiểm tra order tồn tại
- Kiểm tra order chưa PAID
- Cập nhật order sang CANCELLED
- Cập nhật các orderItem chưa phục vụ sang CANCELLED
- Cập nhật bàn về AVAILABLE nếu cần

Quy tắc:
- Order đã PAID không được hủy
- Khi hủy order, cần xử lý đồng bộ orderItem và table trong transaction

---

### 12. Báo cáo

Admin xem báo cáo vận hành và doanh thu.

Các báo cáo cần có:
- Doanh thu theo ngày
- Số lượng order đã thanh toán
- Món bán chạy
- Món bị hủy nhiều
- Bàn đang sử dụng
- Phương thức thanh toán phổ biến

---

## LUỒNG TRẠNG THÁI

### TableStatus

AVAILABLE -> OCCUPIED
AVAILABLE -> RESERVED
RESERVED -> OCCUPIED:rOCCUPIED -> AVAILABLE

### OrderStatus

PENDING -> CONFIRMED
CONFIRMED -> PREPARING
PREPARING -> SERVED
CONFIRMED -> PAID
PREPARING -> PAID
SERVED -> PAID

PENDING -> CANCELLED

### OrderItemStatus

PENDING -> CONFIRMED
CONFIRMED -> COOKING
COOKING -> READY
READY -> SERVED

PENDING -> CANCELLED