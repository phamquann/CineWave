package com.cinema.booking.service;

import com.cinema.booking.dto.request.MockPaymentRequest;
import com.cinema.booking.exception.BadRequestException;
import com.cinema.booking.exception.ResourceNotFoundException;
import com.cinema.booking.exception.SeatConflictException;
import com.cinema.booking.model.Booking;
import com.cinema.booking.model.Showtime;
import com.cinema.booking.model.Voucher;
import com.cinema.booking.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.FindAndModifyOptions;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final BookingRepository bookingRepository;
    private final MongoTemplate mongoTemplate;

    /**
     * Phân hệ 4: Giả lập Thanh toán (Mock Payment Gateway)
     * - Nếu SUCCESS: Chuyển đơn sang PAID, chuyển ghế từ LOCKED sang BOOKED,
     *   cộng usedCount của Voucher lên 1, và sinh chuỗi mã vé qrCode.
     * - Nếu FAILED: Chuyển đơn sang CANCELLED, giải phóng ghế về AVAILABLE.
     */
    public Booking processMockPayment(MockPaymentRequest request) {
        Booking booking = bookingRepository.findById(request.getBookingId().trim())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + request.getBookingId()));

        if (!"PENDING".equalsIgnoreCase(booking.getStatus())) {
            throw new BadRequestException("Đơn hàng không ở trạng thái chờ thanh toán (Trạng thái hiện tại: " + booking.getStatus() + ")");
        }

        LocalDateTime now = LocalDateTime.now();

        if (request.getCustomerName() != null && !request.getCustomerName().isBlank()) {
            booking.setCustomerName(request.getCustomerName().trim());
        }
        if (request.getCustomerPhone() != null && !request.getCustomerPhone().isBlank()) {
            booking.setCustomerPhone(request.getCustomerPhone().trim());
        }
        if (request.getCustomerEmail() != null && !request.getCustomerEmail().isBlank()) {
            booking.setUserEmail(request.getCustomerEmail().trim());
        }

        if ("FAILED".equalsIgnoreCase(request.getPaymentStatus())) {
            releaseSeatsToAvailable(booking);
            booking.setStatus("CANCELLED");
            if (booking.getSeats() != null) {
                booking.getSeats().forEach(s -> {
                    s.setStatus("AVAILABLE");
                    s.setLockedBy(null);
                    s.setLockedUntil(null);
                });
            }
            return bookingRepository.save(booking);
        }

        // Kiểm tra hạn giữ ghế 10 phút trước khi xác nhận SUCCESS
        if (booking.getExpiresAt() != null && booking.getExpiresAt().isBefore(now)) {
            releaseSeatsToAvailable(booking);
            booking.setStatus("EXPIRED");
            bookingRepository.save(booking);
            throw new BadRequestException("Thời gian giữ ghế (10 phút) đã hết hạn. Vui lòng đặt lại!");
        }

        // Nếu đơn có sử dụng Voucher -> Cộng usedCount lên 1 một cách nguyên tử
        if (booking.getVoucherCode() != null && !booking.getVoucherCode().isBlank()) {
            Query voucherQuery = new Query(Criteria.where("code").is(booking.getVoucherCode())
                    .and("isActive").is(true)
                    .andOperator(Criteria.where("$expr").is(
                            org.bson.Document.parse("{ $lt: [\"$usedCount\", \"$usageLimit\"] }")
                    )));
            Update voucherUpdate = new Update().inc("usedCount", 1);
            Voucher updatedVoucher = mongoTemplate.findAndModify(
                    voucherQuery,
                    voucherUpdate,
                    FindAndModifyOptions.options().returnNew(true),
                    Voucher.class
            );
            if (updatedVoucher == null) {
                throw new BadRequestException("Mã giảm giá " + booking.getVoucherCode() + " đã hết lượt sử dụng");
            }
        }

        // Chuyển trạng thái các ghế trong Showtime từ LOCKED sang BOOKED
        Query showtimeQuery = new Query(Criteria.where("_id").is(booking.getShowtimeId()));
        Update showtimeUpdate = new Update()
                .set("seats.$[elem].status", "BOOKED")
                .set("seats.$[elem].lockedUntil", null)
                .filterArray(Criteria.where("elem.seatCode").in(booking.getSeatCodes()));
        mongoTemplate.updateFirst(showtimeQuery, showtimeUpdate, Showtime.class);

        // Sinh chuỗi mã vé qrCode duy nhất
        String shortId = booking.getId().length() > 6
                ? booking.getId().substring(booking.getId().length() - 6).toUpperCase()
                : booking.getId().toUpperCase();
        String qrCode = "CW-QR-" + shortId + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        booking.setStatus("PAID");
        booking.setQrCode(qrCode);
        booking.setPaidAt(now);
        if (booking.getSeats() != null) {
            booking.getSeats().forEach(s -> {
                s.setStatus("BOOKED");
                s.setLockedUntil(null);
            });
        }

        return bookingRepository.save(booking);
    }

    /**
     * Khách hàng chủ động hủy đơn đang PENDING
     */
    public Booking cancelBooking(String bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + bookingId));

        if (!"PENDING".equalsIgnoreCase(booking.getStatus())) {
            throw new BadRequestException("Chỉ có thể hủy đơn hàng đang ở trạng thái PENDING");
        }

        releaseSeatsToAvailable(booking);
        booking.setStatus("CANCELLED");
        if (booking.getSeats() != null) {
            booking.getSeats().forEach(s -> {
                s.setStatus("AVAILABLE");
                s.setLockedBy(null);
                s.setLockedUntil(null);
            });
        }
        return bookingRepository.save(booking);
    }

    /**
     * Soát vé QR (Staff / Admin):
     * Quét mã qrCode để chuyển trạng thái vé sang CHECKED_IN (chỉ cho phép quét thành công duy nhất 1 lần).
     */
    public Booking checkInByQrCode(String qrCode) {
        Booking booking = bookingRepository.findByQrCode(qrCode.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy vé với mã QR: " + qrCode));

        if ("CHECKED_IN".equalsIgnoreCase(booking.getStatus())) {
            throw new SeatConflictException("Vé này đã được soát (CHECKED_IN) trước đó! Chỉ cho phép quét 1 lần duy nhất.");
        }

        if (!"PAID".equalsIgnoreCase(booking.getStatus())) {
            throw new BadRequestException("Vé không hợp lệ để soát (Trạng thái hiện tại: " + booking.getStatus() + ")");
        }

        booking.setStatus("CHECKED_IN");
        booking.setCheckedInAt(LocalDateTime.now());
        return bookingRepository.save(booking);
    }

    public void releaseSeatsToAvailable(Booking booking) {
        if (booking.getShowtimeId() == null || booking.getSeatCodes() == null || booking.getSeatCodes().isEmpty()) {
            return;
        }
        Query query = new Query(Criteria.where("_id").is(booking.getShowtimeId()));
        Update update = new Update()
                .set("seats.$[elem].status", "AVAILABLE")
                .set("seats.$[elem].lockedBy", null)
                .set("seats.$[elem].lockedUntil", null)
                .filterArray(Criteria.where("elem.seatCode").in(booking.getSeatCodes()));
        mongoTemplate.updateFirst(query, update, Showtime.class);
    }
}

