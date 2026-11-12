package com.cinema.booking.service;

import com.cinema.booking.model.Booking;
import com.cinema.booking.model.Showtime;
import com.cinema.booking.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class SeatCleanupScheduler {

    private final BookingRepository bookingRepository;
    private final PaymentService paymentService;
    private final MongoTemplate mongoTemplate;

    /**
     * Thuật toán 5: Tự động Giải phóng Ghế quá hạn (Background CronJob chạy mỗi 60 giây)
     * Quét tất cả đơn PENDING có expiresAt < LocalDateTime.now(), cập nhật đơn thành EXPIRED
     * và trả trạng thái các ghế liên quan trong showtimes về AVAILABLE.
     */
    @Scheduled(fixedRate = 60000)
    public void cleanupExpiredSeatsAndBookings() {
        LocalDateTime now = LocalDateTime.now();

        List<Booking> expiredBookings = bookingRepository.findByStatusAndExpiresAtBefore("PENDING", now);
        if (!expiredBookings.isEmpty()) {
            log.info("[SeatCleanupScheduler] Phát hiện {} đơn hàng PENDING quá hạn 10 phút. Đang giải phóng ghế...", expiredBookings.size());
            for (Booking booking : expiredBookings) {
                paymentService.releaseSeatsToAvailable(booking);
                booking.setStatus("EXPIRED");
                if (booking.getSeats() != null) {
                    booking.getSeats().forEach(s -> {
                        s.setStatus("AVAILABLE");
                        s.setLockedBy(null);
                        s.setLockedUntil(null);
                    });
                }
                bookingRepository.save(booking);
            }
        }

        // Quét bổ sung mọi ghế LOCKED quá hạn trong tất cả các suất chiếu
        Query expiredSeatsQuery = new Query(Criteria.where("seats").elemMatch(
                Criteria.where("status").is("LOCKED").and("lockedUntil").lt(now)
        ));
        Update releaseUpdate = new Update()
                .set("seats.$[exp].status", "AVAILABLE")
                .set("seats.$[exp].lockedBy", null)
                .set("seats.$[exp].lockedUntil", null)
                .filterArray(Criteria.where("exp.status").is("LOCKED").and("exp.lockedUntil").lt(now));
        mongoTemplate.updateMulti(expiredSeatsQuery, releaseUpdate, Showtime.class);
    }
}

