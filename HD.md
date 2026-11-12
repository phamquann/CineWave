<<<<<<< HEAD

PHẦN 1: Danh sách Chức năng Chi tiết (Chia theo Role & Nghiệp vụ)Hệ thống không cần làm các chức năng rườm rà (như bình luận, tin tức), mà tập trung vào 4 phân hệ có luồng dữ liệu và trạng thái biến đổi liên tục:1. Phân hệ Xác thực & Phân quyền (Auth & RBAC)Đăng ký tài khoản (Customer): Kiểm tra định dạng Email, độ mạnh mật khẩu (tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số), trùng lặp Email trong DB.Đăng nhập (Customer, Staff, Admin): Trả về accessToken (JWT) chứa userId và role, kèm thời gian hết hạn (exp).Khóa/Mở khóa tài khoản (Admin): Cho phép vô hiệu hóa tài khoản vi phạm (isActive = false). Dùng để test kịch bản: Tài khoản có Token hợp lệ nhưng vừa bị Admin khóa thì gọi API đặt vé phải bị chặn (403 Forbidden).2. Phân hệ Quản lý Phim & Suất chiếu (Movie & Showtime Management)Quản lý Phim (Admin): Thêm/Sửa/Xóa phim, phân loại độ tuổi (P, T13, T16, T18) và trạng thái (COMING_SOON, NOW_SHOWING, ENDED).Tạo Suất chiếu & Tự động sinh Sơ đồ ghế (Admin):Nhập thông tin: Phim, Phòng chiếu (Cinema 01, Cinema 02), Thời gian bắt đầu (startTime), Giá vé gốc (basePrice).Hệ thống tự động tính endTime = startTime + durationMinutes + 15 phút (dọn phòng).Tự động khởi tạo danh sách 40–60 ghế nhúng vào suất chiếu với 3 loại: STANDARD (hàng A–C), VIP (hàng D–F, cộng thêm 20.000đ), COUPLE (hàng G, nhân đôi giá gốc + phụ thu).Xem lịch chiếu & Sơ đồ ghế (Public): Hiển thị danh sách ghế theo thời gian thực với 3 trạng thái: AVAILABLE (Trống), LOCKED (Đang có người giữ chờ thanh toán), BOOKED (Đã bán).3. Phân hệ Giữ ghế & Khuyến mãi (Core Booking & Voucher) — Trọng tâm TestGiữ ghế tạm thời (Hold Seats - 10 phút):Khách hàng chọn từ 1 đến tối đa 8 ghế trong 1 lần giao dịch.Kiểm tra quy tắc chọn ghế (không để trống 1 ghế lẻ ở giữa).Khóa ghế nguyên tử trong 10 phút (lockedUntil = now + 10 minutes) và tạo đơn hàng trạng thái PENDING.Áp dụng Mã giảm giá (Apply Voucher):Kiểm tra tính hợp lệ của Voucher: Tồn tại, đang kích hoạt (isActive), trong thời hạn (startDate <= now <= expiryDate), còn lượt sử dụng (usedCount < usageLimit), và tổng tiền ghế đạt mức tối thiểu (originalAmount >= minOrderValue).Tính số tiền được giảm theo 2 hình thức: Giảm thẳng tiền mặt (FIXED) hoặc Giảm theo phần trăm (PERCENT kèm mức trần maxDiscountAmount).4. Phân hệ Thanh toán & Soát vé (Payment Webhook & QR Check-in)Giả lập Thanh toán (Mock Payment Gateway):Cung cấp API giả lập kết quả trả về từ cổng thanh toán (SUCCESS hoặc FAILED).Nếu SUCCESS: Chuyển đơn hàng sang PAID, chuyển ghế từ LOCKED sang BOOKED, cộng usedCount của Voucher lên 1, và sinh chuỗi mã vé qrCode.Nếu FAILED hoặc khách hàng chủ động hủy: Chuyển đơn sang CANCELLED, giải phóng ghế về AVAILABLE.Soát vé QR (Staff / Admin): Quét mã qrCode để chuyển trạng thái vé sang CHECKED_IN (chỉ cho phép quét thành công duy nhất 1 lần).PHẦN 2: 5 Thuật toán Nghiệp vụ Cốt lõi cần cài đặtViệc đưa 5 thuật toán này vào Backend sẽ giúp đồ án của bạn có độ sâu kỹ thuật và tạo ra hàng chục kịch bản Test Case đắt giá:1. Thuật toán Kiểm tra Trùng lịch Phòng chiếu (Interval Overlap Algorithm)Khi Admin tạo một suất chiếu mới tại phòng R với thời gian [NewStart, NewEnd], hệ thống phải kiểm tra xem có suất chiếu nào đang tồn tại ở phòng R với thời gian [ExistingStart, ExistingEnd] bị giao nhau không:

$$
\text{isOverlapping} = (\text{NewStart} < \text{ExistingEnd}) \land (\text{NewEnd} > \text{ExistingStart})
$$

Nếu biểu thức trên TRUE 

$\rightarrow$ Ném lỗi 409 Conflict ("Phòng chiếu đã có lịch trong khung giờ này").2. Thuật toán Chống ghế trống lẻ ("Orphan Seat" Rule Algorithm)Rạp phim thực tế không cho phép khách chọn ghế tạo ra 1 ghế trống cô lập (ví dụ: Dãy có ghế A1, A2, A3, A4 đang trống, khách chọn A2 thì A1 bị lẻ 1 mình ở bìa; hoặc khách chọn A1, A3 để trống A2 ở giữa).Logic xử lý trên mảng ghế cùng 1 hàng: Sau khi đánh dấu tạm các ghế khách vừa chọn, duyệt qua từng hàng ghế. Nếu phát hiện mẫu trạng thái [BOOKED/SELECTED/WALL] - [AVAILABLE (1 ghế duy nhất)] - [BOOKED/SELECTED/WALL] $\rightarrow$ Trả về lỗi 400 Bad Request ("Không được để trống 1 ghế lẻ bên cạnh hoặc ở giữa").3. Thuật toán Khóa ghế Nguyên tử chống Race Condition (Atomic Seat Locking)Khi 2 khách hàng cùng bấm đặt ghế A1 tại cùng một mili-giây:Không dùng cách findById() đưa lên RAM kiểm tra rồi mới save() (vì cả 2 luồng sẽ cùng đọc thấy AVAILABLE).Sử dụng truy vấn cập nhật nguyên tử của MongoDB (findAndModify / updateFirst): Tìm suất chiếu có _id tương ứng VÀ không có bất kỳ ghế nào trong danh sách đặt đang ở trạng thái khác AVAILABLE (hoặc nếu LOCKED thì thời gian lockedUntil đã nhỏ hơn now). Nếu số bản ghi cập nhật (modifiedCount) bằng 0 $\rightarrow$ Lập tức trả về 409 Conflict.4. Thuật toán Tính giá vé Động & Khuyến mãi có Trần (Dynamic Pricing & Capped Discount)Bước 1 (Tính tổng tiền gốc):
$$
\text{OriginalAmount} = \sum_{i=1}^{n} (\text{BasePrice} + \text{SeatTypeSurcharge}_i)
$$

Bước 2 (Tính tiền giảm giá Voucher):Nếu discountType == "FIXED": $\text{Discount} = \text{discountValue}$Nếu discountType == "PERCENT":
$$
\text{Discount} = \min\left(\text{OriginalAmount} \times \frac{\text{discountValue}}{100}, \text{maxDiscountAmount}\right)
$$

Bước 3 (Thành tiền cuối cùng): $\text{FinalAmount} = \max(0, \text{OriginalAmount} - \text{Discount})$.5. Thuật toán Tự động Giải phóng Ghế quá hạn (Background CronJob + Lazy Expiration)Kết hợp 2 cơ chế để giải phóng ghế sau 10 phút không thanh toán:Scheduled Job (@Scheduled chạy mỗi 60 giây trong Spring Boot): Quét tất cả đơn PENDING có expiresAt < LocalDateTime.now(), cập nhật đơn thành EXPIRED và trả trạng thái các ghế liên quan trong showtimes về AVAILABLE.Lazy Check: Ngay khi có người gọi API xem sơ đồ ghế hoặc đặt ghế, những ghế có status == "LOCKED" nhưng lockedUntil < now sẽ được coi như AVAILABLE.PHẦN 3: Cấu trúc Chi tiết 2 Dự án (File BE và File FE)Bạn nên tách thành 2 thư mục (hoặc 2 Repository) riêng biệt để đúng chuẩn thực tế và dễ cấu hình Playwright sau này.1. Cấu trúc Dự án Backend (cinema-booking-be — Java Spring Boot + MongoDB)Dự án chạy ở cổng http://localhost:8080, cung cấp toàn bộ RESTful API và Swagger UI.Plaintextcinema-booking-be/
├── pom.xml                                  # Khai báo dependencies: Web, MongoDB, Validation, Security, JWT, Lombok, Swagger
├── src/main/resources/
│   └── application.yml                      # Cấu hình chuỗi kết nối MongoDB, cổng 8080, JWT Secret Key, thời gian giữ ghế (600s)
└── src/main/java/com/cinema/booking/
    ├── CinemaBookingApplication.java        # Điểm chạy chương trình (Bật @EnableScheduling cho CronJob nhả ghế)
    ├── config/
    │   ├── SecurityConfig.java              # Cấu hình CORS cho FE, phân quyền URL theo Role (CUSTOMER, STAFF, ADMIN)
    │   ├── SwaggerConfig.java               # Cấu hình giao diện Swagger UI có nút nhập Bearer Token
    │   └── MongoConfig.java                 # Cấu hình MongoTransactionManager (nếu dùng Replica Set)
    ├── model/                               # Các Collection trong MongoDB
    │   ├── User.java                        # @Document("users")
    │   ├── Movie.java                       # @Document("movies")
    │   ├── Showtime.java                    # @Document("showtimes") - Chứa List<Seat></seat> nhúng bên trong
    │   ├── Seat.java                        # Class nhúng: seatCode, type, price, status, lockedBy, lockedUntil
    │   ├── Voucher.java                     # @Document("vouchers")
    │   └── Booking.java                     # @Document("bookings")
    ├── dto/                                 # Dữ liệu đầu vào/đầu ra kèm @Valid bắt lỗi Boundary
    │   ├── request/
    │   │   ├── LoginRequest.java            # @NotBlank email, password
    │   │   ├── CreateShowtimeRequest.java   # @NotNull movieId, startTime, @Min(50000) basePrice
    │   │   ├── HoldSeatRequest.java         # @NotEmpty, @Size(min=1, max=8) seatCodes
    │   │   ├── ApplyVoucherRequest.java     # @NotBlank voucherCode
    │   │   └── MockPaymentRequest.java      # bookingId, paymentStatus (SUCCESS / FAILED)
    │   └── response/
    │       ├── ApiResponse.java             # Chuẩn hóa JSON trả về: { code, message, data, timestamp }
    │       └── BookingSummaryResponse.java
    ├── repository/                          # Giao tiếp với MongoDB
    │   ├── UserRepository.java
    │   ├── MovieRepository.java
    │   ├── ShowtimeRepository.java
    │   ├── VoucherRepository.java
    │   └── BookingRepository.java
    ├── service/                             # Nơi chứa 5 thuật toán cốt lõi
    │   ├── AuthService.java                 # Xử lý đăng ký, đăng nhập, sinh JWT
    │   ├── ShowtimeService.java             # Thuật toán 1: Check trùng giờ chiếu & Tự sinh 50 ghế
    │   ├── BookingService.java              # Thuật toán 2, 3, 4: Check ghế lẻ, Khóa ghế nguyên tử, Tính tiền Voucher
    │   ├── PaymentService.java              # Xử lý kết quả thanh toán, sinh mã QR, cập nhật trạng thái ghế sang BOOKED
    │   └── SeatCleanupScheduler.java        # Thuật toán 5: @Scheduled(fixedRate = 60000) quét và nhả ghế quá hạn 10 phút
    ├── controller/                          # Các REST API Endpoints để bắn Postman
    │   ├── AuthController.java              # /api/auth/**
    │   ├── MovieController.java             # /api/movies/**
    │   ├── ShowtimeController.java          # /api/showtimes/**
    │   ├── BookingController.java           # /api/bookings/**
    │   └── PaymentController.java           # /api/payments/**
    └── exception/                           # Bắt lỗi tập trung trả về đúng HTTP Status Code
        ├── GlobalExceptionHandler.java      # @RestControllerAdvice bắt lỗi 400, 401, 403, 404, 409
        ├── SeatConflictException.java       # Ném ra mã 409 Conflict khi đặt trùng ghế
        └── OrphanSeatException.java         # Ném ra mã 400 Bad Request khi để trống 1 ghế lẻ
2. Cấu trúc Dự án Frontend (cinema-booking-fe — Giao diện tối giản phục vụ Test & Playwright)Bạn không cần dùng framework nặng nề nếu muốn làm nhanh; có thể dùng React (Vite) hoặc thậm chí HTML5 + Bootstrap/Tailwind + Fetch API (Vanilla JS) chạy ở cổng http://localhost:3000. Điểm quan trọng nhất của FE trong đồ án QA là mọi phần tử tương tác đều phải gắn thuộc tính data-testid để sau này viết Playwright cực kỳ ổn định.Plaintextcinema-booking-fe/
├── index.html                               # Trang chủ: Danh sách phim & Chọn suất chiếu
├── login.html                               # Màn hình 1: Đăng nhập / Đăng ký
├── booking.html                             # Màn hình 2: Sơ đồ ghế, Đồng hồ đếm ngược 10p, Nhập Voucher & Thanh toán
├── my-tickets.html                          # Màn hình 3: Lịch sử đặt vé & Hiển thị mã QR
├── admin-dashboard.html                     # Màn hình 4 (Tối giản): Form tạo suất chiếu & Nút quét thử QR
├── css/
│   └── style.css                            # Định nghĩa màu ghế rõ ràng:
│                                            # .seat-available (Trắng), .seat-selected (Xanh lá),
│                                            # .seat-locked (Vàng cam), .seat-booked (Đỏ - disabled)
└── js/
    ├── api-client.js                        # Hàm gọi Fetch API tới http://localhost:8080/api/..., tự động đính kèm JWT từ localStorage
    ├── auth.js                              # Xử lý form Login, lưu accessToken vào localStorage
    ├── seat-map.js                          # Render sơ đồ ghế 8x8, xử lý click chọn ghế (tối đa 8), tính tiền tạm tính trên UI
    ├── checkout.js                          # Gọi API /hold, bật bộ đếm ngược 10:00, gọi API /apply-voucher và nút Giả lập Thanh toán
    └── tickets.js                           # Hiển thị trạng thái vé (PENDING, PAID, CANCELLED) và mã QR
Quy ước gắn data-testid trên file FE để dọn đường sẵn cho Playwright:Khi viết code HTML cho FE, bạn cài sẵn các thuộc tính sau vào thẻ HTML:Ô nhập Email/Password: data-testid="input-email", data-testid="input-password", data-testid="btn-login".Từng chiếc ghế trên sơ đồ: data-testid="seat-A1", data-testid="seat-A2", kèm thuộc tính trạng thái data-status="AVAILABLE" (hoặc "LOCKED", "BOOKED").Khu vực Voucher & Giỏ hàng: data-testid="input-voucher", data-testid="btn-apply-voucher", data-testid="text-discount-amount", data-testid="text-final-amount".Khu vực Thanh toán & Thông báo lỗi: data-testid="btn-hold-seats", data-testid="btn-pay-success", data-testid="btn-pay-fail", data-testid="alert-error-message".PHẦN 4: Bảng Ánh xạ Chức năng sang Kịch bản Kiểm thử (Testing Matrix)Khi bảo vệ đồ án hoặc đưa vào Portfolio, bạn dùng bảng này để chứng minh thiết kế hệ thống của bạn sinh ra là để phục vụ Kiểm thử chuyên nghiệp:Chức năng / Thuật toánKiểm thử bằng Postman (API)Kiểm thử MongoDB (DB Verification)Kiểm thử bằng Playwright (UI + API)Giữ ghế (1–8 ghế)Test biên: Gửi mảng 0 ghế, 1 ghế, 8 ghế, 9 ghế. Kiểm tra HTTP 400 và 201.Query db.showtimes.find() kiểm tra trường seats.$.status chuyển thành "LOCKED" và có lockedUntil.Click chọn 9 ghế trên UI $\rightarrow$ Kiểm tra popup báo lỗi hiển thị. Chọn 2 ghế $\rightarrow$ Kiểm tra màu ghế đổi từ Trắng sang Xanh.Thuật toán Ghế lẻ (Orphan Seat)Gửi request đặt ghế ["A1", "A3"] khi A2 đang trống $\rightarrow$ Expect 400 Bad Request.Đảm bảo không có bản ghi Booking nào được tạo ra trong DB khi vi phạm quy tắc ghế lẻ.Click ghế A1 và A3 trên màn hình $\rightarrow$ Bấm "Tiếp tục" $\rightarrow$ Kiểm tra data-testid="alert-error-message" báo lỗi ghế lẻ.Chống đặt trùng (Race Condition)Dùng Postman Runner bắn song song 5 luồng cùng đặt ghế B5. Đúng 1 luồng 201, 4 luồng 409.Kiểm tra trong collection bookings chỉ có duy nhất 1 đơn PENDING chứa ghế B5.Mở 2 Browser Context độc lập trong Playwright, cùng click ghế B5 và bấm Đặt vé cùng lúc.Tính toán VoucherDecision Table: Test mã hết hạn, chưa tới ngày, đơn chưa đủ 150k, mã hết lượt dùng.Sau khi thanh toán thành công, kiểm tra vouchers.usedCount trong MongoDB tăng thêm đúng 1 đơn vị.Nhập mã "GIAM50K" vào ô input $\rightarrow$ Bấm Áp dụng $\rightarrow$ Assert số tiền trên UI giảm đúng 50.000đ.
=======

PHẦN 1: Danh sách Chức năng Chi tiết (Chia theo Role & Nghiệp vụ)Hệ thống không cần làm các chức năng rườm rà (như bình luận, tin tức), mà tập trung vào 4 phân hệ có luồng dữ liệu và trạng thái biến đổi liên tục:1. Phân hệ Xác thực & Phân quyền (Auth & RBAC)Đăng ký tài khoản (Customer): Kiểm tra định dạng Email, độ mạnh mật khẩu (tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số), trùng lặp Email trong DB.Đăng nhập (Customer, Staff, Admin): Trả về accessToken (JWT) chứa userId và role, kèm thời gian hết hạn (exp).Khóa/Mở khóa tài khoản (Admin): Cho phép vô hiệu hóa tài khoản vi phạm (isActive = false). Dùng để test kịch bản: Tài khoản có Token hợp lệ nhưng vừa bị Admin khóa thì gọi API đặt vé phải bị chặn (403 Forbidden).2. Phân hệ Quản lý Phim & Suất chiếu (Movie & Showtime Management)Quản lý Phim (Admin): Thêm/Sửa/Xóa phim, phân loại độ tuổi (P, T13, T16, T18) và trạng thái (COMING_SOON, NOW_SHOWING, ENDED).Tạo Suất chiếu & Tự động sinh Sơ đồ ghế (Admin):Nhập thông tin: Phim, Phòng chiếu (Cinema 01, Cinema 02), Thời gian bắt đầu (startTime), Giá vé gốc (basePrice).Hệ thống tự động tính endTime = startTime + durationMinutes + 15 phút (dọn phòng).Tự động khởi tạo danh sách 40–60 ghế nhúng vào suất chiếu với 3 loại: STANDARD (hàng A–C), VIP (hàng D–F, cộng thêm 20.000đ), COUPLE (hàng G, nhân đôi giá gốc + phụ thu).Xem lịch chiếu & Sơ đồ ghế (Public): Hiển thị danh sách ghế theo thời gian thực với 3 trạng thái: AVAILABLE (Trống), LOCKED (Đang có người giữ chờ thanh toán), BOOKED (Đã bán).3. Phân hệ Giữ ghế & Khuyến mãi (Core Booking & Voucher) — Trọng tâm TestGiữ ghế tạm thời (Hold Seats - 10 phút):Khách hàng chọn từ 1 đến tối đa 8 ghế trong 1 lần giao dịch.Kiểm tra quy tắc chọn ghế (không để trống 1 ghế lẻ ở giữa).Khóa ghế nguyên tử trong 10 phút (lockedUntil = now + 10 minutes) và tạo đơn hàng trạng thái PENDING.Áp dụng Mã giảm giá (Apply Voucher):Kiểm tra tính hợp lệ của Voucher: Tồn tại, đang kích hoạt (isActive), trong thời hạn (startDate <= now <= expiryDate), còn lượt sử dụng (usedCount < usageLimit), và tổng tiền ghế đạt mức tối thiểu (originalAmount >= minOrderValue).Tính số tiền được giảm theo 2 hình thức: Giảm thẳng tiền mặt (FIXED) hoặc Giảm theo phần trăm (PERCENT kèm mức trần maxDiscountAmount).4. Phân hệ Thanh toán & Soát vé (Payment Webhook & QR Check-in)Giả lập Thanh toán (Mock Payment Gateway):Cung cấp API giả lập kết quả trả về từ cổng thanh toán (SUCCESS hoặc FAILED).Nếu SUCCESS: Chuyển đơn hàng sang PAID, chuyển ghế từ LOCKED sang BOOKED, cộng usedCount của Voucher lên 1, và sinh chuỗi mã vé qrCode.Nếu FAILED hoặc khách hàng chủ động hủy: Chuyển đơn sang CANCELLED, giải phóng ghế về AVAILABLE.Soát vé QR (Staff / Admin): Quét mã qrCode để chuyển trạng thái vé sang CHECKED_IN (chỉ cho phép quét thành công duy nhất 1 lần).PHẦN 2: 5 Thuật toán Nghiệp vụ Cốt lõi cần cài đặtViệc đưa 5 thuật toán này vào Backend sẽ giúp đồ án của bạn có độ sâu kỹ thuật và tạo ra hàng chục kịch bản Test Case đắt giá:1. Thuật toán Kiểm tra Trùng lịch Phòng chiếu (Interval Overlap Algorithm)Khi Admin tạo một suất chiếu mới tại phòng R với thời gian [NewStart, NewEnd], hệ thống phải kiểm tra xem có suất chiếu nào đang tồn tại ở phòng R với thời gian [ExistingStart, ExistingEnd] bị giao nhau không:

$$
\text{isOverlapping} = (\text{NewStart} < \text{ExistingEnd}) \land (\text{NewEnd} > \text{ExistingStart})
$$

Nếu biểu thức trên TRUE 

$\rightarrow$ Ném lỗi 409 Conflict ("Phòng chiếu đã có lịch trong khung giờ này").2. Thuật toán Chống ghế trống lẻ ("Orphan Seat" Rule Algorithm)Rạp phim thực tế không cho phép khách chọn ghế tạo ra 1 ghế trống cô lập (ví dụ: Dãy có ghế A1, A2, A3, A4 đang trống, khách chọn A2 thì A1 bị lẻ 1 mình ở bìa; hoặc khách chọn A1, A3 để trống A2 ở giữa).Logic xử lý trên mảng ghế cùng 1 hàng: Sau khi đánh dấu tạm các ghế khách vừa chọn, duyệt qua từng hàng ghế. Nếu phát hiện mẫu trạng thái [BOOKED/SELECTED/WALL] - [AVAILABLE (1 ghế duy nhất)] - [BOOKED/SELECTED/WALL] $\rightarrow$ Trả về lỗi 400 Bad Request ("Không được để trống 1 ghế lẻ bên cạnh hoặc ở giữa").3. Thuật toán Khóa ghế Nguyên tử chống Race Condition (Atomic Seat Locking)Khi 2 khách hàng cùng bấm đặt ghế A1 tại cùng một mili-giây:Không dùng cách findById() đưa lên RAM kiểm tra rồi mới save() (vì cả 2 luồng sẽ cùng đọc thấy AVAILABLE).Sử dụng truy vấn cập nhật nguyên tử của MongoDB (findAndModify / updateFirst): Tìm suất chiếu có _id tương ứng VÀ không có bất kỳ ghế nào trong danh sách đặt đang ở trạng thái khác AVAILABLE (hoặc nếu LOCKED thì thời gian lockedUntil đã nhỏ hơn now). Nếu số bản ghi cập nhật (modifiedCount) bằng 0 $\rightarrow$ Lập tức trả về 409 Conflict.4. Thuật toán Tính giá vé Động & Khuyến mãi có Trần (Dynamic Pricing & Capped Discount)Bước 1 (Tính tổng tiền gốc):
$$
\text{OriginalAmount} = \sum_{i=1}^{n} (\text{BasePrice} + \text{SeatTypeSurcharge}_i)
$$

Bước 2 (Tính tiền giảm giá Voucher):Nếu discountType == "FIXED": $\text{Discount} = \text{discountValue}$Nếu discountType == "PERCENT":
$$
\text{Discount} = \min\left(\text{OriginalAmount} \times \frac{\text{discountValue}}{100}, \text{maxDiscountAmount}\right)
$$

Bước 3 (Thành tiền cuối cùng): $\text{FinalAmount} = \max(0, \text{OriginalAmount} - \text{Discount})$.5. Thuật toán Tự động Giải phóng Ghế quá hạn (Background CronJob + Lazy Expiration)Kết hợp 2 cơ chế để giải phóng ghế sau 10 phút không thanh toán:Scheduled Job (@Scheduled chạy mỗi 60 giây trong Spring Boot): Quét tất cả đơn PENDING có expiresAt < LocalDateTime.now(), cập nhật đơn thành EXPIRED và trả trạng thái các ghế liên quan trong showtimes về AVAILABLE.Lazy Check: Ngay khi có người gọi API xem sơ đồ ghế hoặc đặt ghế, những ghế có status == "LOCKED" nhưng lockedUntil < now sẽ được coi như AVAILABLE.PHẦN 3: Cấu trúc Chi tiết 2 Dự án (File BE và File FE)Bạn nên tách thành 2 thư mục (hoặc 2 Repository) riêng biệt để đúng chuẩn thực tế và dễ cấu hình Playwright sau này.1. Cấu trúc Dự án Backend (cinema-booking-be — Java Spring Boot + MongoDB)Dự án chạy ở cổng http://localhost:8080, cung cấp toàn bộ RESTful API và Swagger UI.Plaintextcinema-booking-be/
├── pom.xml                                  # Khai báo dependencies: Web, MongoDB, Validation, Security, JWT, Lombok, Swagger
├── src/main/resources/
│   └── application.yml                      # Cấu hình chuỗi kết nối MongoDB, cổng 8080, JWT Secret Key, thời gian giữ ghế (600s)
└── src/main/java/com/cinema/booking/
    ├── CinemaBookingApplication.java        # Điểm chạy chương trình (Bật @EnableScheduling cho CronJob nhả ghế)
    ├── config/
    │   ├── SecurityConfig.java              # Cấu hình CORS cho FE, phân quyền URL theo Role (CUSTOMER, STAFF, ADMIN)
    │   ├── SwaggerConfig.java               # Cấu hình giao diện Swagger UI có nút nhập Bearer Token
    │   └── MongoConfig.java                 # Cấu hình MongoTransactionManager (nếu dùng Replica Set)
    ├── model/                               # Các Collection trong MongoDB
    │   ├── User.java                        # @Document("users")
    │   ├── Movie.java                       # @Document("movies")
    │   ├── Showtime.java                    # @Document("showtimes") - Chứa List<Seat></seat> nhúng bên trong
    │   ├── Seat.java                        # Class nhúng: seatCode, type, price, status, lockedBy, lockedUntil
    │   ├── Voucher.java                     # @Document("vouchers")
    │   └── Booking.java                     # @Document("bookings")
    ├── dto/                                 # Dữ liệu đầu vào/đầu ra kèm @Valid bắt lỗi Boundary
    │   ├── request/
    │   │   ├── LoginRequest.java            # @NotBlank email, password
    │   │   ├── CreateShowtimeRequest.java   # @NotNull movieId, startTime, @Min(50000) basePrice
    │   │   ├── HoldSeatRequest.java         # @NotEmpty, @Size(min=1, max=8) seatCodes
    │   │   ├── ApplyVoucherRequest.java     # @NotBlank voucherCode
    │   │   └── MockPaymentRequest.java      # bookingId, paymentStatus (SUCCESS / FAILED)
    │   └── response/
    │       ├── ApiResponse.java             # Chuẩn hóa JSON trả về: { code, message, data, timestamp }
    │       └── BookingSummaryResponse.java
    ├── repository/                          # Giao tiếp với MongoDB
    │   ├── UserRepository.java
    │   ├── MovieRepository.java
    │   ├── ShowtimeRepository.java
    │   ├── VoucherRepository.java
    │   └── BookingRepository.java
    ├── service/                             # Nơi chứa 5 thuật toán cốt lõi
    │   ├── AuthService.java                 # Xử lý đăng ký, đăng nhập, sinh JWT
    │   ├── ShowtimeService.java             # Thuật toán 1: Check trùng giờ chiếu & Tự sinh 50 ghế
    │   ├── BookingService.java              # Thuật toán 2, 3, 4: Check ghế lẻ, Khóa ghế nguyên tử, Tính tiền Voucher
    │   ├── PaymentService.java              # Xử lý kết quả thanh toán, sinh mã QR, cập nhật trạng thái ghế sang BOOKED
    │   └── SeatCleanupScheduler.java        # Thuật toán 5: @Scheduled(fixedRate = 60000) quét và nhả ghế quá hạn 10 phút
    ├── controller/                          # Các REST API Endpoints để bắn Postman
    │   ├── AuthController.java              # /api/auth/**
    │   ├── MovieController.java             # /api/movies/**
    │   ├── ShowtimeController.java          # /api/showtimes/**
    │   ├── BookingController.java           # /api/bookings/**
    │   └── PaymentController.java           # /api/payments/**
    └── exception/                           # Bắt lỗi tập trung trả về đúng HTTP Status Code
        ├── GlobalExceptionHandler.java      # @RestControllerAdvice bắt lỗi 400, 401, 403, 404, 409
        ├── SeatConflictException.java       # Ném ra mã 409 Conflict khi đặt trùng ghế
        └── OrphanSeatException.java         # Ném ra mã 400 Bad Request khi để trống 1 ghế lẻ
2. Cấu trúc Dự án Frontend (cinema-booking-fe — Giao diện tối giản phục vụ Test & Playwright)Bạn không cần dùng framework nặng nề nếu muốn làm nhanh; có thể dùng React (Vite) hoặc thậm chí HTML5 + Bootstrap/Tailwind + Fetch API (Vanilla JS) chạy ở cổng http://localhost:3000. Điểm quan trọng nhất của FE trong đồ án QA là mọi phần tử tương tác đều phải gắn thuộc tính data-testid để sau này viết Playwright cực kỳ ổn định.Plaintextcinema-booking-fe/
├── index.html                               # Trang chủ: Danh sách phim & Chọn suất chiếu
├── login.html                               # Màn hình 1: Đăng nhập / Đăng ký
├── booking.html                             # Màn hình 2: Sơ đồ ghế, Đồng hồ đếm ngược 10p, Nhập Voucher & Thanh toán
├── my-tickets.html                          # Màn hình 3: Lịch sử đặt vé & Hiển thị mã QR
├── admin-dashboard.html                     # Màn hình 4 (Tối giản): Form tạo suất chiếu & Nút quét thử QR
├── css/
│   └── style.css                            # Định nghĩa màu ghế rõ ràng:
│                                            # .seat-available (Trắng), .seat-selected (Xanh lá),
│                                            # .seat-locked (Vàng cam), .seat-booked (Đỏ - disabled)
└── js/
    ├── api-client.js                        # Hàm gọi Fetch API tới http://localhost:8080/api/..., tự động đính kèm JWT từ localStorage
    ├── auth.js                              # Xử lý form Login, lưu accessToken vào localStorage
    ├── seat-map.js                          # Render sơ đồ ghế 8x8, xử lý click chọn ghế (tối đa 8), tính tiền tạm tính trên UI
    ├── checkout.js                          # Gọi API /hold, bật bộ đếm ngược 10:00, gọi API /apply-voucher và nút Giả lập Thanh toán
    └── tickets.js                           # Hiển thị trạng thái vé (PENDING, PAID, CANCELLED) và mã QR
Quy ước gắn data-testid trên file FE để dọn đường sẵn cho Playwright:Khi viết code HTML cho FE, bạn cài sẵn các thuộc tính sau vào thẻ HTML:Ô nhập Email/Password: data-testid="input-email", data-testid="input-password", data-testid="btn-login".Từng chiếc ghế trên sơ đồ: data-testid="seat-A1", data-testid="seat-A2", kèm thuộc tính trạng thái data-status="AVAILABLE" (hoặc "LOCKED", "BOOKED").Khu vực Voucher & Giỏ hàng: data-testid="input-voucher", data-testid="btn-apply-voucher", data-testid="text-discount-amount", data-testid="text-final-amount".Khu vực Thanh toán & Thông báo lỗi: data-testid="btn-hold-seats", data-testid="btn-pay-success", data-testid="btn-pay-fail", data-testid="alert-error-message".PHẦN 4: Bảng Ánh xạ Chức năng sang Kịch bản Kiểm thử (Testing Matrix)Khi bảo vệ đồ án hoặc đưa vào Portfolio, bạn dùng bảng này để chứng minh thiết kế hệ thống của bạn sinh ra là để phục vụ Kiểm thử chuyên nghiệp:Chức năng / Thuật toánKiểm thử bằng Postman (API)Kiểm thử MongoDB (DB Verification)Kiểm thử bằng Playwright (UI + API)Giữ ghế (1–8 ghế)Test biên: Gửi mảng 0 ghế, 1 ghế, 8 ghế, 9 ghế. Kiểm tra HTTP 400 và 201.Query db.showtimes.find() kiểm tra trường seats.$.status chuyển thành "LOCKED" và có lockedUntil.Click chọn 9 ghế trên UI $\rightarrow$ Kiểm tra popup báo lỗi hiển thị. Chọn 2 ghế $\rightarrow$ Kiểm tra màu ghế đổi từ Trắng sang Xanh.Thuật toán Ghế lẻ (Orphan Seat)Gửi request đặt ghế ["A1", "A3"] khi A2 đang trống $\rightarrow$ Expect 400 Bad Request.Đảm bảo không có bản ghi Booking nào được tạo ra trong DB khi vi phạm quy tắc ghế lẻ.Click ghế A1 và A3 trên màn hình $\rightarrow$ Bấm "Tiếp tục" $\rightarrow$ Kiểm tra data-testid="alert-error-message" báo lỗi ghế lẻ.Chống đặt trùng (Race Condition)Dùng Postman Runner bắn song song 5 luồng cùng đặt ghế B5. Đúng 1 luồng 201, 4 luồng 409.Kiểm tra trong collection bookings chỉ có duy nhất 1 đơn PENDING chứa ghế B5.Mở 2 Browser Context độc lập trong Playwright, cùng click ghế B5 và bấm Đặt vé cùng lúc.Tính toán VoucherDecision Table: Test mã hết hạn, chưa tới ngày, đơn chưa đủ 150k, mã hết lượt dùng.Sau khi thanh toán thành công, kiểm tra vouchers.usedCount trong MongoDB tăng thêm đúng 1 đơn vị.Nhập mã "GIAM50K" vào ô input $\rightarrow$ Bấm Áp dụng $\rightarrow$ Assert số tiền trên UI giảm đúng 50.000đ.
>>>>>>> 1b746413460c3711038f34c8ff39ea73829be706
