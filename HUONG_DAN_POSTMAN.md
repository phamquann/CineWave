# HƯỚNG DẪN IMPORT & CHẠY AUTOMATION TEST TRÊN POSTMAN

Dự án đã được đóng gói sẵn 2 file cấu hình chuẩn **Postman v2.1** ngay tại thư mục gốc `d:\xem phim nè\`:

1. **File Collection (38+ Assertions tự động)**: [`cinema-booking-postman-collection.json`](file:///d:/xem%20phim%20nè/cinema-booking-postman-collection.json)
2. **File Environment (`localhost:8080`)**: [`cinema-booking-postman-environment.json`](file:///d:/xem%20phim%20nè/cinema-booking-postman-environment.json)

---

## Bước 1: Khởi động Backend Server (`localhost:8080`)

Đảm bảo MongoDB (`mongodb://localhost:27017`) đang bật, sau đó chạy Backend Spring Boot bằng 1 trong 2 cách:

```powershell
# Cách 1: Chạy trực tiếp từ file JAR đã build
java -jar d:\xem phim nè\cinema-booking-be\target\cinema-booking-be-1.0.0.jar

# Cách 2: Chạy bằng Maven
mvn -f "d:\xem phim nè\cinema-booking-be\pom.xml" spring-boot:run
```

---

## Bước 2: Import vào Postman (2 cách)

### Cách A — Import bộ Collection kèm kịch bản QA Automation (Khuyên dùng)
1. Mở **Postman** -> Nhấn nút **Import** (góc trên bên trái).
2. Kéo thả cả 2 file sau vào cửa sổ Import:
   - `d:\xem phim nè\cinema-booking-postman-collection.json`
   - `d:\xem phim nè\cinema-booking-postman-environment.json`
3. Ở góc trên bên phải của Postman, chọn Environment: **`CineWave Local Environment (localhost:8080)`**.

### Cách B — Import trực tiếp từ OpenAPI / Swagger URL (Khi Backend đang chạy)
1. Mở **Postman** -> Nhấn **Import**.
2. Dán đường dẫn OpenAPI 3.0 của Backend vào ô URL:
   ```text
   http://localhost:8080/api-docs
   ```
   *(Hoặc xem giao diện Swagger UI trực tiếp trên trình duyệt tại `http://localhost:8080/swagger-ui.html`)*.

---

## Bước 3: Chạy tự động toàn bộ 32 API bằng Collection Runner

Bộ Collection [`cinema-booking-postman-collection.json`](file:///d:/xem%20phim%20nè/cinema-booking-postman-collection.json) đã được lập trình sẵn script `pm.test(...)` và `pm.collectionVariables.set(...)` để **tự động truyền Token & ID** từ API trước sang API sau mà không cần copy-paste thủ công:

1. Nhấp chuột phải vào Collection **`CineWave - Cinema Ticket Booking System (Full API & QA Automation Suite)`** -> Chọn **Run collection**.
2. Nhấn nút **Run CineWave...**.
3. Postman sẽ tự động chạy tuần tự **6 Folder (32 kịch bản)** từ đầu đến cuối và dọn dẹp dữ liệu test ở bước cuối (`6.4 Cleanup`):

| Thứ tự Folder | Nội dung kiểm thử tự động | Biến tự động trích xuất |
| :--- | :--- | :--- |
| **01. Auth & RBAC** | Đăng nhập 4 Roles (`ADMIN`, `STAFF`, `CUSTOMER`, `TESTLOCK`), test mật khẩu yếu (`400`), trùng email (`409`), `/auth/me` | `adminToken`, `staffToken`, `customerToken`, `lockedUserToken`, `lockedUserId` |
| **02. Movies & Showtimes** | Lấy danh sách phim, tạo phim mới (`201`), tạo suất chiếu tự sinh 56 ghế (`201`), **Thuật toán 1** trùng lịch chiếu (`409 Conflict`), giá vé `< 50.000đ` (`400`) | `movieId`, `createdMovieId`, `showtimeId`, `newShowtimeId` |
| **03. Core Booking & Hold Seats** | Biên `0 ghế` (`400`), `9 ghế` (`400`), **Thuật toán 2** chừa 1 ghế trống lẻ ở bìa `A1` hoặc giữa `A2` (`400`), **Thuật toán 3** giữ ghế Atomic Lock (`201`), chống đặt trùng ghế `LOCKED` (`409 Conflict`) | `bookingId` |
| **04. Vouchers (Decision Table)** | Áp mã `GIAM50K` (`FIXED`), `VIP50PT` (`PERCENT` chạm trần `80.000đ`), `EXPIRED10` (`400`), `FUTURE50` (`400`), `SOLDOUT99` (`400`) | Kiểm tra `discountAmount` & `finalAmount` |
| **05. Payment & QR Check-in** | Giả lập thanh toán `SUCCESS` (`200` -> sinh mã QR), nhân viên quét QR lần 1 (`200 CHECKED_IN`), quét QR lần 2 cùng mã (`409 Conflict`), thanh toán `FAILED` (`CANCELLED` & nhả ghế) | `qrCode`, `cancelBookingId` |
| **06. Security Edge Case** | Admin khóa tài khoản `testlock@cinema.com` -> User gọi API đặt ghế khi JWT còn hạn bị chặn `403 Forbidden` -> Mở khóa lại & xóa suất chiếu test | Reset sạch trạng thái để chạy lại không giới hạn |

