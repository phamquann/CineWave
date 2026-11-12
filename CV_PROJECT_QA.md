# MÔ TẢ DỰ ÁN DÀNH CHO CV QA / TESTER (MANUAL, API & AUTOMATION TEST)

File này tổng hợp sẵn các mẫu mô tả dự án **CineWave — Hệ thống Đặt Vé Xem Phim & Quản Trị Rạp Chiếu (Cinema Ticket Booking System)** theo đúng chuẩn **ATS / CV QA Engineer (Manual + API + Automation Test)** bằng cả **Tiếng Việt** và **Tiếng Anh** để bạn copy trực tiếp vào CV.

---

## 1. Bản Tiếng Việt — Ngắn gọn (Dùng để dán trực tiếp vào CV 1 trang)

**Tên dự án:** Hệ thống Đặt Vé Rạp Chiếu Phim Trực Tuyến (CineWave Cinema Booking System)  
**Vị trí:** QA / Software Tester (API, Database & Automation Testing)  
**Công nghệ & Công cụ Test:** Postman, Playwright, JUnit 5, MongoDB (NoSQL), Swagger UI, Java Spring Boot, ReactJS, JWT.  

**Mô tả ngắn:**  
Hệ thống đặt vé xem phim thời gian thực theo kiến trúc RESTful API kết hợp cơ chế khóa ghế nguyên tử (Atomic Seat Locking), tính giá động theo hạng ghế/voucher và soát vé QR một lần.

**Trách nhiệm & Thành tựu chính (Bullet points trong CV):**
- **Thiết kế Test Case & Test Scenario:** Áp dụng kỹ thuật Phân tích giá trị biên (*Boundary Value Analysis* cho giới hạn chọn 1–8 ghế, giá vé tối thiểu) và Bảng quyết định (*Decision Table* cho điều kiện áp dụng Voucher: hạn sử dụng, số lượt dùng, giá trị đơn tối thiểu, giảm giá có trần `maxDiscountAmount`).
- **Kiểm thử API & Bảo mật phân quyền (Postman):** Xây dựng bộ Collection kiểm thử tự động các luồng nghiệp vụ (`Auth/RBAC`, `Showtimes`, `Hold Seats`, `Voucher`, `Payment Webhook`, `QR Check-in`); kiểm thử phân quyền `CUSTOMER / STAFF / ADMIN` và kịch bản thu hồi quyền tức thời (`403 Forbidden`) khi tài khoản bị khóa dù JWT Token còn hạn.
- **Kiểm thử Đồng thời & Race Condition (Concurrency Testing):** Giả lập nhiều luồng request song song đặt cùng một mã ghế tại cùng thời điểm bằng Postman Runner để xác nhận cơ chế khóa nguyên tử (`findAndModify` / `updateFirst`) chỉ cho phép đúng 1 giao dịch thành công (`201 Created`) và chặn các luồng trùng lặp (`409 Conflict`).
- **Kiểm thử Nghiệp vụ phức tạp & Database (MongoDB):** Truy vấn trực tiếp MongoDB để đối chiếu tính toàn vẹn dữ liệu cho 5 thuật toán cốt lõi: Chống trùng lịch phòng chiếu (*Interval Overlap*), Chống ghế trống lẻ (*Orphan Seat Rule*), Tự động nhả ghế quá hạn 10 phút (*CronJob & Lazy Expiration*), và Soát vé QR duy nhất 1 lần (`PAID` $\rightarrow$ `CHECKED_IN`).
- **Kiểm thử Tự động Giao diện (Playwright E2E):** Chuẩn hóa hệ thống định danh `data-testid` trên toàn bộ luồng đặt vé, chọn ghế, áp mã giảm giá và thanh toán giúp kịch bản Automated UI Test chạy ổn định, không phụ thuộc CSS selector.

---

## 2. Bản Tiếng Anh — Chuẩn Quốc Tế (Dành cho CV Tiếng Anh)

**Project Name:** CineWave — Real-Time Cinema Ticket Booking & Management System  
**Role:** QA Engineer (API, Database & E2E Automation Testing)  
**Tech Stack & Testing Tools:** Postman (Collection Runner), Playwright, JUnit 5, MongoDB Compass, Swagger/OpenAPI, Java Spring Boot, React, JWT Auth.

**Short Summary:**  
A full-stack cinema ticketing platform featuring real-time seat reservation, atomic concurrency control, dynamic tiered pricing, capped promotional vouchers, and single-use QR ticket validation.

**Key Responsibilities & Achievements:**
- **Test Design & Coverage:** Engineered comprehensive test cases using **Boundary Value Analysis (BVA)** (1–8 seat limits, minimum base price validation) and **Decision Table Testing** for complex voucher rules (FIXED vs. PERCENT discounts, `maxDiscountAmount` cap, expiration dates, usage limits, and minimum order thresholds).
- **API & Concurrency Testing (Postman):** Built automated API test suites covering 20+ REST endpoints (`200`, `201`, `400`, `401`, `403`, `404`, `409`); executed multi-threaded **Race Condition tests** via Postman Runner to verify MongoDB atomic seat locking (`updateFirst` with array filters), ensuring zero double-booking under concurrent load.
- **Business Logic & Algorithm Validation:** Verified 5 core backend algorithms including **Room Schedule Overlap Detection** (+15m cleanup buffer), **Orphan Seat Prevention** (blocking isolated single empty seats), and **10-Minute Seat Hold Expiration** (via Spring `@Scheduled` background jobs and lazy evaluation).
- **Security & RBAC Verification:** Tested JWT authentication and Role-Based Access Control (`ADMIN`, `STAFF`, `CUSTOMER`), including real-time account deactivation checks (`isActive = false` returning `403 Forbidden` even with an active JWT token).
- **E2E UI Automation & DB Verification:** Instrumented deterministic `data-testid` attributes across React components for **Playwright E2E testing**, and performed NoSQL queries in **MongoDB** to validate state transitions (`AVAILABLE` $\rightarrow$ `LOCKED` $\rightarrow$ `BOOKED`, `PENDING` $\rightarrow$ `PAID` $\rightarrow$ `CHECKED_IN`).

---

## 3. Bản Siêu Ngắn Gọn (3 dòng — Nếu CV của bạn có ít diện tích)

> **CineWave — Cinema Ticket Booking System (QA / Tester)**  
> - **Tools:** Postman, Playwright, MongoDB, Swagger, JUnit 5 (Java Spring Boot + React).  
> - Kiểm thử End-to-End (UI, RESTful API, Database) cho hệ thống đặt vé xem phim thời gian thực với 4 phân hệ: Phân quyền RBAC/JWT, Xếp lịch & Sơ đồ 56 ghế, Giữ ghế nguyên tử 10 phút & Khuyến mãi, Thanh toán & Soát vé QR.  
> - Áp dụng **BVA & Decision Table** kiểm thử 5 thuật toán cốt lõi: Chống trùng lịch phòng chiếu (`409`), Chống chọn ghế lẻ (`400`), Chống đặt trùng ghế đồng thời (*Race Condition*), Tính giá Voucher có trần giảm giá, và Tự động giải phóng ghế quá hạn.

---

## 4. Từ khóa Kỹ năng (Keywords) nên đưa vào mục Skills của CV

- **Testing Methodologies:** API Testing, Functional Testing, Boundary Value Analysis (BVA), Equivalence Partitioning, Decision Table Testing, Concurrency / Race Condition Testing, RBAC Security Testing, Database Testing (NoSQL), Regression Testing, E2E UI Automation.
- **Tools & Frameworks:** Postman, Newman, Playwright, JUnit 5, Swagger / OpenAPI, MongoDB Compass, Git.
- **Domain Knowledge:** E-Commerce / Ticketing Workflow, State Machine Transitions (`PENDING` / `PAID` / `CANCELLED` / `EXPIRED` / `CHECKED_IN`), Payment Webhook Simulation, Atomic Locking.

