# CẨM NANG: DỰA VÀO ĐÂU & CÁCH VIẾT TÀI LIỆU QA / TEST CASE / POSTMAN BẰNG MARKDOWN

Tài liệu này giải thích chi tiết **nguồn căn cứ (dựa vào đâu)** và **phương pháp viết từng phần** của các file Markdown trong dự án ([`CV_PROJECT_QA.md`](file:///d:/xem%20phim%20nè/CV_PROJECT_QA.md), [`HUONG_DAN_UNIT_TEST.md`](file:///d:/xem%20phim%20nè/HUONG_DAN_UNIT_TEST.md), [`HUONG_DAN_POSTMAN.md`](file:///d:/xem%20phim%20nè/HUONG_DAN_POSTMAN.md)) để bạn có thể tự viết cho mọi dự án khác hoặc trả lời phỏng vấn QA/QC.

---

## PHẦN 1: DỰA VÀO ĐÂU ĐỂ VIẾT? (4 NGUỒN CĂN CỨ CỐT LÕI)

Khi một QA/Tester bắt đầu viết Test Case, Postman Collection hoặc tài liệu Markdown cho dự án, tuyệt đối không viết cảm tính mà phải trích xuất từ **4 nguồn (Input Artifacts)** sau:

### 1. Tài liệu Đặc tả Yêu cầu Nghiệp vụ (SRS / BRD — trong dự án này là [`HD.md`](file:///d:/xem%20phim%20nè/HD.md))
Từ file đặc tả [`HD.md`](file:///d:/xem%20phim%20nè/HD.md), bạn rút ra các **Business Rules (Quy tắc nghiệp vụ)** để thiết kế kịch bản kiểm thử:
* **Quy tắc phân quyền (RBAC)**: Có 3 role (`CUSTOMER`, `STAFF`, `ADMIN`) và quy tắc bảo mật *"Khóa tài khoản (`isActive = false`) khi JWT còn hạn phải trả về `403 Forbidden`"*.
* **Quy tắc 1 – Xếp lịch chiếu**: Thời gian kết thúc = `startTime + duration + 15 phút dọn rạp`. Nếu trùng phòng và giao thoa thời gian -> báo lỗi `409 Conflict`.
* **Quy tắc 2 – Chống ghế trống lẻ (Orphan Seat Rule)**: Không được để trống đúng 1 ghế đơn độc ở bìa trái/phải (cột 1, cột 8) hoặc kẹp giữa 2 ghế đã chọn (`A1, A3` chừa `A2`) -> báo lỗi `400 Bad Request`.
* **Quy tắc 3 – Giữ chỗ 10 phút & Chống đặt trùng (Race Condition)**: Tối đa 8 ghế/lần; hai người bấm cùng lúc chỉ 1 người giữ được ghế (`201 Created`), người thứ 2 nhận `409 Conflict`.
* **Quy tắc 4 – Bảng quyết định Voucher (Decision Table)**: Loại `FIXED` và `PERCENT` (có trần `maxDiscountAmount`), kiểm tra ngày bắt đầu, ngày hết hạn, số lượt dùng (`usageLimit`) và giá trị đơn tối thiểu (`minOrderValue`).
* **Quy tắc 5 – Vé QR dùng 1 lần (Single-use QR)**: Nhân viên quét lần 1 -> `200 OK` (`CHECKED_IN`); quét lần 2 cùng mã -> `409 Conflict`.

---

### 2. Các file Controller & DTO trong Source Code Backend (`cinema-booking-be`)
Để viết đúng **URL Endpoint, HTTP Method (`GET/POST/PUT/PATCH/DELETE`), Request Body JSON và mã lỗi Validation (`400`)**, bạn nhìn trực tiếp vào 2 thư mục của Backend:
* **Thư mục `controller/`** (Xác định đường dẫn API & Role được phép gọi):
  * [`AuthController.java`](file:///d:/xem%20phim%20nè/cinema-booking-be/src/main/java/com/cinema/booking/controller/AuthController.java): `/api/auth/login`, `/api/auth/register`, `/api/auth/me`, `/api/auth/users/{id}/status`
  * [`ShowtimeController.java`](file:///d:/xem%20phim%20nè/cinema-booking-be/src/main/java/com/cinema/booking/controller/ShowtimeController.java): `/api/showtimes`
  * [`BookingController.java`](file:///d:/xem%20phim%20nè/cinema-booking-be/src/main/java/com/cinema/booking/controller/BookingController.java): `/api/bookings/hold`, `/api/bookings/apply-voucher`
  * [`PaymentController.java`](file:///d:/xem%20phim%20nè/cinema-booking-be/src/main/java/com/cinema/booking/controller/PaymentController.java): `/api/payments/mock`, `/api/payments/check-in`
* **Thư mục `dto/request/`** (Xác định **Giá trị biên - Boundary Value Analysis** từ các Annotation `@Min`, `@Size`, `@Pattern`, `@NotBlank`):
  * Nhìn vào [`HoldSeatRequest.java`](file:///d:/xem%20phim%20nè/cinema-booking-be/src/main/java/com/cinema/booking/dto/request/HoldSeatRequest.java#L19-L21): thấy `@Size(min = 1, max = 8)` -> lập tức viết được 3 test case biên: `0 ghế` (400), `1–8 ghế` (201), `9 ghế` (400).
  * Nhìn vào [`CreateShowtimeRequest.java`](file:///d:/xem%20phim%20nè/cinema-booking-be/src/main/java/com/cinema/booking/dto/request/CreateShowtimeRequest.java#L27-L28): thấy `@Min(value = 50000)` -> viết được test case biên `basePrice = 40000` (400) và `basePrice = 50000` (201).
  * Nhìn vào [`RegisterRequest.java`](file:///d:/xem%20phim%20nè/cinema-booking-be/src/main/java/com/cinema/booking/dto/request/RegisterRequest.java#L19-L22): thấy Regex mật khẩu `^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$` -> viết test case mật khẩu yếu `"123456"` (400).

---

### 3. File Khởi tạo Dữ liệu Mẫu ([`DataInitializer.java`](file:///d:/xem%20phim%20nè/cinema-booking-be/src/main/java/com/cinema/booking/config/DataInitializer.java))
Để biết **Tài khoản đăng nhập sẵn** và **Mã giảm giá có sẵn** trong Database khi viết hướng dẫn chạy Postman:
* Đọc [`DataInitializer.java`](file:///d:/xem%20phim%20nè/cinema-booking-be/src/main/java/com/cinema/booking/config/DataInitializer.java) sẽ thấy ngay:
  * 4 tài khoản mẫu: `admin@cinema.com` (`Admin@123`), `staff@cinema.com` (`Staff@123`), `customer@cinema.com` (`Customer@123`), `testlock@cinema.com` (`Test@1234`).
  * 6 mã Voucher phục vụ từng nhánh test: `GIAM50K` (FIXED), `VIP50PT` (PERCENT Capped), `EXPIRED10` (Hết hạn), `FUTURE50` (Chưa mở), `SOLDOUT99` (Hết lượt).

---

### 4. Cấu trúc Phản hồi Chuẩn ([`ApiResponse.java`](file:///d:/xem%20phim%20nè/cinema-booking-be/src/main/java/com/cinema/booking/dto/response/ApiResponse.java) & [`GlobalExceptionHandler.java`](file:///d:/xem%20phim%20nè/cinema-booking-be/src/main/java/com/cinema/booking/exception/GlobalExceptionHandler.java))
* Mọi JSON trả về từ Backend đều có cấu trúc:
  ```json
  {
    "code": 200,
    "message": "Thành công",
    "data": { ... },
    "timestamp": "..."
  }
  ```
* Nhờ biết cấu trúc này, khi viết script kiểm thử tự động trong Postman (`pm.test`), ta luôn truy cập qua `pm.response.json().data.<tên_trường>` và đối chiếu đúng mã HTTP (`200`, `201`, `400`, `401`, `403`, `404`, `409`).

---

## PHẦN 2: CÁCH VIẾT FILE MARKDOWN (`.md`) CHUẨN QA / DEV

### 1. Cú pháp Markdown cơ bản cần nhớ
Chỉ cần nắm 6 cú pháp sau là viết được mọi tài liệu kỹ thuật đẹp và chuẩn GitHub:

```markdown
# Tiêu đề lớn (H1 - Tên tài liệu)
## Tiêu đề mục chính (H2 - Tên phần)
### Tiêu đề mục con (H3)

- **Chữ in đậm**: dùng `**nội dung**` để nhấn mạnh mã HTTP (`200 OK`, `409 Conflict`), tên thuật toán.
- `Code inline`: dùng dấu huyền (backtick) `` `tên_biến` `` cho đường dẫn API (`/api/bookings/hold`), tên biến (`bookingId`), tên file.
- Khối lệnh (Code block): dùng 3 dấu huyền kèm tên ngôn ngữ (`json`, `bash`, `java`, `javascript`).
```

**Cách kẻ bảng (Table) cho Test Case / API**:
```markdown
| Mã TC | Tên kịch bản | Input (Dữ liệu đầu vào) | Expected Output (Kết quả kỳ vọng) | Kỹ thuật Test |
| :--- | :--- | :--- | :--- | :--- |
| TC01 | Đặt 0 ghế | `seatCodes: []` | `400 Bad Request` | Boundary Value |
| TC02 | Chừa ghế lẻ A1 | `seatCodes: ["A2"]` | `400 Bad Request` | Error Guessing / Rule |
```

---

### 2. Bố cục chuẩn khi viết 3 loại tài liệu Markdown cho QA

#### Loại A: Viết mô tả dự án cho CV QA ([`CV_PROJECT_QA.md`](file:///d:/xem%20phim%20nè/CV_PROJECT_QA.md))
Áp dụng công thức **STAR (Situation – Task – Action – Result)**:
1. **Tên dự án + Tech Stack + Vai trò** (`QA / Automation & API Tester`).
2. **Mô tả ngắn (1–2 câu)**: Hệ thống làm gì, có những luồng nghiệp vụ chính nào.
3. **Kỹ thuật kiểm thử đã áp dụng (Action)**:
   - Thiết kế Test Case theo **Equivalence Partitioning (Phân vùng tương đương)**, **Boundary Value Analysis (Giá trị biên)**, **Decision Table (Bảng quyết định)**, **State Transition (Chuyển đổi trạng thái ghế & vé)**.
   - Kiểm thử API & Automation trên **Postman** (`pm.test`, Chaining Variables, Collection Runner).
   - Kiểm thử đồng thời (**Concurrency / Race Condition**) và bảo mật phân quyền (**JWT / RBAC**).
   - Viết & chạy **Unit Test JUnit 5 + Mockito**.
4. **Số lượng & Kết quả định lượng (Result)**: Nêu con số cụ thể (ví dụ: *57 Unit Tests pass 100%, 32 kịch bản Postman Automation, bao phủ 5 thuật toán cốt lõi*).

#### Loại B: Viết tài liệu Hướng dẫn Postman / API ([`HUONG_DAN_POSTMAN.md`](file:///d:/xem%20phim%20nè/HUONG_DAN_POSTMAN.md))
Bố cục gồm 4 bước rõ ràng để bất kỳ ai đọc cũng làm theo được trong 2 phút:
1. **Điều kiện tiên quyết (Prerequisites)**: Lệnh chạy Backend, cổng kết nối (`localhost:8080`), Database (`localhost:27017`).
2. **Cách Import**: Chỉ rõ file nào là Collection, file nào là Environment.
3. **Bảng danh mục các Folder kiểm thử**: Giải thích mỗi Folder test chức năng gì, dùng kỹ thuật gì và tự động lưu biến nào (`adminToken`, `bookingId`, `qrCode`).
4. **Cách đọc kết quả Pass/Fail** trên Collection Runner.

#### Loại C: Viết tài liệu Hướng dẫn Unit Test ([`HUONG_DAN_UNIT_TEST.md`](file:///d:/xem%20phim%20nè/HUONG_DAN_UNIT_TEST.md))
Bố cục gồm:
1. **Công cụ sử dụng**: JUnit 5 (`@Test`, `@DisplayName`, `assertEquals`, `assertThrows`) + Mockito (`@Mock`, `@InjectMocks`, `when().thenReturn()`).
2. **Mô hình 3 bước AAA (Arrange – Act – Assert)** trong mỗi hàm test.
3. **Bảng ánh xạ từ Thuật toán nghiệp vụ sang File Test**: Chỉ rõ mỗi thuật toán nằm ở file Service nào và được kiểm chứng bởi file `*Test.java` nào.
4. **Lệnh chạy thực tế**: Lệnh Maven (`mvn test`) để chạy toàn bộ hoặc chạy lẻ từng class.

