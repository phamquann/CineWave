# HƯỚNG DẪN UNIT TESTING — CineWave Cinema Booking (Java / JUnit 5 / Mockito)

> Kết quả hiện tại: **57 test, 0 lỗi** (`BUILD SUCCESS`).

## 1. Unit Test là gì & test cái gì trong dự án này?

Unit Test kiểm tra **từng hàm/lớp nhỏ, chạy độc lập, không cần MongoDB, không cần chạy server**. Chạy trong vài trăm mili-giây.

Dự án này có logic nghiệp vụ nằm ở lớp `service`, nên đó là nơi unit test có giá trị nhất:

| Thuật toán (HD.md) | Class được test | File test | Kỹ thuật |
|---|---|---|---|
| 1. Trùng lịch phòng chiếu (Interval Overlap) | `ShowtimeService.createShowtime` | `ShowtimeServiceTest` | Boundary Value, Mockito |
| 2. Ghế trống lẻ (Orphan Seat) | `BookingService.validateNoOrphanSeats` | `OrphanSeatRuleTest` | Parameterized, Equivalence Partitioning |
| 4. Voucher & giảm giá có trần | `VoucherService.validateAndCalculateDiscount` | `VoucherServiceTest` | Decision Table, BVA |
| 5. Nhả ghế quá hạn (Lazy Check) | `ShowtimeService.applyLazyExpirationCheck` | `ShowtimeServiceTest` | Mockito, verify |
| Thanh toán, hủy, soát vé QR | `PaymentService` | `PaymentServiceTest` | State transition, Mockito |

**Không unit test thuật toán 3 (Atomic Locking / Race Condition)**: nó phụ thuộc cơ chế `updateFirst` của MongoDB thật, nên phải test bằng Integration Test hoặc Postman Runner bắn song song.

Vị trí file: `cinema-booking-be/src/test/java/com/cinema/booking/service/`

---

## 2. Cách chạy

```powershell
cd "d:\xem phim nè"

# Chạy toàn bộ test
mvn -f cinema-booking-be/pom.xml test

# Chạy 1 class
mvn -f cinema-booking-be/pom.xml test -Dtest=VoucherServiceTest

# Chạy 1 method
mvn -f cinema-booking-be/pom.xml test -Dtest=VoucherServiceTest#expired
```

Nếu máy chưa có `mvn` trong PATH, dùng Maven đi kèm IDE (IntelliJ: mở `pom.xml` → chuột phải thư mục `test` → *Run All Tests*). Báo cáo HTML/XML nằm ở `cinema-booking-be/target/surefire-reports/`.

---

## 3. Cấu trúc 1 test chuẩn: Arrange – Act – Assert (AAA)

```java
@Test
@DisplayName("DT3: Đã hết hạn (expiryDate < now) -> 400")
void expired() {
    // ARRANGE: chuẩn bị dữ liệu, chỉ phá ĐÚNG 1 điều kiện
    Voucher v = validFixed().expiryDate(now.minusMinutes(1)).build();

    // ACT + ASSERT: gọi hàm và kiểm tra kết quả/ngoại lệ
    BadRequestException ex = assertThrows(BadRequestException.class,
            () -> service.validateAndCalculateDiscount(v, 200000));
    assertTrue(ex.getMessage().contains("hết hạn"));
}
```

Quy tắc:
- **Mỗi test chỉ kiểm 1 hành vi**, tên + `@DisplayName` nói rõ input → kết quả mong đợi.
- `@BeforeEach` dựng đối tượng mới cho mỗi test (các test không ảnh hưởng nhau).
- Test case lỗi phải assert **loại exception** và nên assert cả **nội dung thông báo**.

---

## 4. Các kỹ thuật dùng trong dự án (có thể ghi vào CV)

### 4.1 Decision Table — `VoucherServiceTest`
Mỗi điều kiện hợp lệ của voucher là 1 cột; mỗi test **chỉ làm sai 1 điều kiện** để biết chính xác điều kiện nào gây lỗi:

| Test | isActive | Trong hạn | Còn lượt | Đủ minOrder | Kết quả |
|---|---|---|---|---|---|
| mặc định | ✔ | ✔ | ✔ | ✔ | Giảm tiền |
| DT1 | ✘ | ✔ | ✔ | ✔ | 400 |
| DT2 (chưa tới ngày) | ✔ | ✘ | ✔ | ✔ | 400 |
| DT3 (hết hạn) | ✔ | ✘ | ✔ | ✔ | 400 |
| DT4 (hết lượt) | ✔ | ✔ | ✘ | ✔ | 400 |
| minOrder | ✔ | ✔ | ✔ | ✘ | 400 |

### 4.2 Boundary Value Analysis (BVA) — dùng `@ParameterizedTest` + `@CsvSource`
Một method chạy nhiều bộ dữ liệu, mỗi dòng là 1 test case riêng:

```java
@ParameterizedTest(name = "BVA minOrder: đơn {0}đ -> hợp lệ = {1}")
@CsvSource({
    "149999, false",   // ngay dưới biên
    "150000, true",    // đúng biên
    "150001, true"     // ngay trên biên
})
void minOrderValueBoundary(double orderAmount, boolean shouldPass) { ... }
```
Các biên đã phủ: `minOrderValue` (149.999 / 150.000 / 150.001), `usedCount` so với `usageLimit` (9/10/11), trần giảm giá PERCENT (đúng bằng trần), `NewStart == ExistingEnd` của lịch chiếu (**hợp lệ** vì công thức dùng `<` chặt).

### 4.3 Mockito — thay thế Repository bằng "diễn viên đóng thế" — `ShowtimeServiceTest`, `PaymentServiceTest`

```java
showtimeRepo = Mockito.mock(ShowtimeRepository.class);          // tạo mock
when(showtimeRepo.findByRoomName("Cinema 01"))
        .thenReturn(List.of(existing));                         // dạy mock trả dữ liệu
...
verify(showtimeRepo, never()).save(any());                      // khẳng định: KHÔNG được ghi DB khi bị trùng lịch
verify(mongoTemplate).updateFirst(any(), any(), eq(Showtime.class)); // khẳng định: có chuyển ghế sang BOOKED
```

- `when(...).thenReturn(...)`: giả lập dữ liệu có sẵn trong DB.
- `thenAnswer(inv -> inv.getArgument(0))`: `save()` trả lại đúng đối tượng được truyền vào.
- `verify(..., never())`: chứng minh "không có tác dụng phụ" khi vi phạm quy tắc (tương ứng yêu cầu *"không có Booking nào được tạo khi vi phạm"* trong HD.md).

### 4.4 State Transition Testing — `PaymentServiceTest`
```
PENDING --SUCCESS--> PAID --check-in--> CHECKED_IN
PENDING --FAILED/hủy--> CANCELLED
PENDING --quá 10 phút--> EXPIRED
```
Phủ cả đường **hợp lệ** và **chuyển trạng thái bất hợp lệ** (thanh toán 2 lần, hủy đơn đã PAID, quét QR lần 2 → `409`, quét vé chưa thanh toán → `400`, mã QR sai → `404`).

---

## 5. Cách viết thêm 1 test mới (quy trình 5 bước)

1. **Đọc hàm cần test**, liệt kê các nhánh `if/throw` và các giá trị biên.
2. **Lập bảng test case** (input → kết quả mong đợi) trước khi viết code.
3. Tạo class trong `src/test/java/...` cùng package với class được test, tên kết thúc bằng `Test`.
4. Viết theo AAA; nếu hàm gọi Repository/MongoTemplate thì `Mockito.mock(...)`.
5. Chạy `mvn test -Dtest=TenClassTest`, cố tình sửa code để test **fail** một lần, xác nhận test thực sự bắt được lỗi (mutation check thủ công).

Ví dụ nhanh — thêm test "giá ghế COUPLE ở basePrice tối thiểu 50.000đ":

```java
@Test
void coupleSeatPriceAtMinimumBasePrice() {
    List<Seat> seats = new ShowtimeService(null, null, null).generateSeats(50000);
    double g1 = seats.stream().filter(s -> s.getSeatCode().equals("G1"))
                     .findFirst().orElseThrow().getPrice();
    assertEquals(50000 + (50000 + 20000), g1);   // 120.000
}
```

---

## 6. Unit Test vs. các loại test khác trong dự án

| Loại | Công cụ | Cần DB/Server? | Dùng cho |
|---|---|---|---|
| **Unit Test** | JUnit 5 + Mockito | Không | Logic thuần của service (thuật toán 1, 2, 4, 5, state machine) |
| API Test | Postman | Có (BE + Mongo) | Mã HTTP 200/201/400/401/403/409, RBAC |
| Race Condition | Postman Runner / Playwright 2 context | Có | Thuật toán 3 (khóa ghế nguyên tử) |
| E2E UI | Playwright + `data-testid` | Có (FE + BE) | Luồng người dùng thật |

---

## 7. Lưu ý kỹ thuật

- `pom.xml` dùng `<forkCount>1</forkCount>` (mặc định). Trước đây từng đặt `0` để tránh treo trong môi trường hạn chế; **không nên để `0`** vì Mockito cần nạp agent vào JVM, `forkCount=0` có thể làm test bị treo.
- Test cho `VoucherService`, `OrphanSeatRuleTest` truyền `null` cho Repository vì các hàm đó là **pure function** (không đụng DB).
- Có thể đo độ phủ bằng JaCoCo: thêm plugin `jacoco-maven-plugin` vào `pom.xml` rồi chạy `mvn test jacoco:report` → xem `target/site/jacoco/index.html`.

## 8. Dòng ghi vào CV

> Viết **57 unit test** (JUnit 5, Mockito, Parameterized Test) cho 5 thuật toán nghiệp vụ cốt lõi: áp dụng **Decision Table** & **Boundary Value Analysis** (voucher, lịch chiếu, ghế lẻ), **State Transition Testing** (PENDING → PAID → CHECKED_IN) và mock Repository để cô lập logic; chạy tự động qua Maven Surefire.

