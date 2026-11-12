package com.cinema.booking.service;

import com.cinema.booking.dto.request.ApplyVoucherRequest;
import com.cinema.booking.dto.request.HoldSeatRequest;
import com.cinema.booking.dto.response.BookingSummaryResponse;
import com.cinema.booking.exception.BadRequestException;
import com.cinema.booking.exception.OrphanSeatException;
import com.cinema.booking.exception.ResourceNotFoundException;
import com.cinema.booking.exception.SeatConflictException;
import com.cinema.booking.model.Booking;
import com.cinema.booking.model.Seat;
import com.cinema.booking.model.Showtime;
import com.cinema.booking.model.User;
import com.cinema.booking.model.Voucher;
import com.cinema.booking.repository.BookingRepository;
import com.cinema.booking.repository.ShowtimeRepository;
import com.mongodb.client.result.UpdateResult;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ShowtimeRepository showtimeRepository;
    private final VoucherService voucherService;
    private final MongoTemplate mongoTemplate;

    @Value("${app.booking.hold-duration-seconds:600}")
    private long holdDurationSeconds;

    /**
     * Giữ ghế tạm thời (Hold Seats - 10 phút)
     * Kết hợp:
     * - Lazy Expiration Check (Thuật toán 5b)
     * - Thuật toán 2: Kiểm tra ghế trống lẻ (Orphan Seat Rule)
     * - Thuật toán 3: Khóa ghế nguyên tử chống Race Condition (Atomic Seat Locking)
     * - Thuật toán 4 (Bước 1): Tính tổng tiền gốc theo loại ghế
     */
    public Booking holdSeats(HoldSeatRequest request, User currentUser) {
        List<String> normalizedCodes = request.getSeatCodes().stream()
                .filter(c -> c != null && !c.isBlank())
                .map(c -> c.trim().toUpperCase().replace("-", ""))
                .collect(Collectors.toList());

        if (normalizedCodes.isEmpty() || normalizedCodes.size() > 8) {
            throw new BadRequestException("Chỉ được chọn từ 1 đến tối đa 8 ghế trong 1 lần giao dịch");
        }

        Set<String> uniqueCodes = new HashSet<>(normalizedCodes);
        if (uniqueCodes.size() != normalizedCodes.size()) {
            throw new BadRequestException("Danh sách ghế chứa mã ghế bị trùng lặp");
        }

        LocalDateTime now = LocalDateTime.now();

        // Lazy Check nguyên tử: Giải phóng các ghế LOCKED đã quá hạn trong suất chiếu này trước khi kiểm tra
        releaseExpiredLocksAtomically(request.getShowtimeId(), now);

        Showtime showtime = showtimeRepository.findById(request.getShowtimeId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy suất chiếu với ID: " + request.getShowtimeId()));

        Map<String, Seat> seatMap = showtime.getSeats().stream()
                .collect(Collectors.toMap(s -> s.getSeatCode().toUpperCase(), s -> s));

        List<Seat> selectedSeats = new ArrayList<>();
        for (String code : normalizedCodes) {
            Seat seat = seatMap.get(code);
            if (seat == null) {
                throw new BadRequestException("Mã ghế không tồn tại trong sơ đồ phòng chiếu: " + code);
            }
            if (!"AVAILABLE".equalsIgnoreCase(seat.getStatus())) {
                throw new SeatConflictException("Ghế " + code + " đã có người đặt hoặc đang được giữ");
            }
            selectedSeats.add(seat);
        }

        // Thuật toán 2: Kiểm tra quy tắc chống ghế trống lẻ (Orphan Seat Rule)
        validateNoOrphanSeats(showtime.getSeats(), uniqueCodes, now);

        // Thuật toán 3: Khóa ghế nguyên tử (Atomic Seat Locking) bằng MongoDB updateFirst + arrayFilters
        LocalDateTime lockedUntil = now.plusSeconds(holdDurationSeconds);

        Criteria[] seatAvailableCriteria = normalizedCodes.stream()
                .map(code -> Criteria.where("seats").elemMatch(
                        Criteria.where("seatCode").is(code)
                                .and("status").is("AVAILABLE")
                ))
                .toArray(Criteria[]::new);

        Query lockQuery = new Query(new Criteria().andOperator(
                Criteria.where("_id").is(showtime.getId()),
                new Criteria().andOperator(seatAvailableCriteria)
        ));

        Update lockUpdate = new Update()
                .set("seats.$[elem].status", "LOCKED")
                .set("seats.$[elem].lockedBy", currentUser.getId())
                .set("seats.$[elem].lockedUntil", lockedUntil)
                .filterArray(Criteria.where("elem.seatCode").in(normalizedCodes));

        UpdateResult updateResult = mongoTemplate.updateFirst(lockQuery, lockUpdate, Showtime.class);
        if (updateResult.getModifiedCount() == 0) {
            throw new SeatConflictException("Một hoặc nhiều ghế vừa được người khác đặt cùng lúc (409 Conflict)");
        }

        // Thuật toán 4 (Bước 1): Tính tổng tiền gốc = Sum(BasePrice + SeatTypeSurcharge_i)
        double originalAmount = selectedSeats.stream()
                .mapToDouble(s -> showtime.getBasePrice() + s.getSurcharge())
                .sum();

        List<Seat> bookingSeatsSnapshot = selectedSeats.stream()
                .map(s -> Seat.builder()
                        .seatCode(s.getSeatCode())
                        .row(s.getRow())
                        .number(s.getNumber())
                        .type(s.getType())
                        .surcharge(s.getSurcharge())
                        .price(showtime.getBasePrice() + s.getSurcharge())
                        .status("LOCKED")
                        .lockedBy(currentUser.getId())
                        .lockedUntil(lockedUntil)
                        .build())
                .collect(Collectors.toList());

        Booking booking = Booking.builder()
                .userId(currentUser.getId())
                .userEmail(currentUser.getEmail())
                .customerName(currentUser.getFullName())
                .customerPhone(currentUser.getPhone())
                .showtimeId(showtime.getId())
                .movieId(showtime.getMovieId())
                .movieTitle(showtime.getMovieTitle())
                .roomName(showtime.getRoomName())
                .format(showtime.getFormat())
                .startTime(showtime.getStartTime())
                .seatCodes(normalizedCodes)
                .seats(bookingSeatsSnapshot)
                .originalAmount(originalAmount)
                .voucherCode(null)
                .discountAmount(0.0)
                .finalAmount(originalAmount)
                .status("PENDING")
                .qrCode(null)
                .createdAt(now)
                .expiresAt(lockedUntil)
                .build();

        return bookingRepository.save(booking);
    }

    /**
     * Thuật toán 2: Thuật toán Chống ghế trống lẻ ("Orphan Seat" Rule Algorithm)
     * Sau khi đánh dấu tạm các ghế khách vừa chọn, duyệt qua từng hàng ghế có ghế được chọn.
     * Nếu phát hiện mẫu trạng thái [BOOKED/LOCKED/SELECTED/WALL] - [AVAILABLE (1 ghế duy nhất)] - [BOOKED/LOCKED/SELECTED/WALL]
     * -> Ném lỗi 400 Bad Request ("Không được để trống 1 ghế lẻ bên cạnh hoặc ở giữa").
     */
    public void validateNoOrphanSeats(List<Seat> allSeats, Set<String> selectedCodes, LocalDateTime now) {
        // Xác định các hàng ghế mà khách có chọn ghế
        Set<String> affectedRows = allSeats.stream()
                .filter(s -> selectedCodes.contains(s.getSeatCode().toUpperCase()))
                .map(Seat::getRow)
                .collect(Collectors.toSet());

        for (String row : affectedRows) {
            List<Seat> rowSeats = allSeats.stream()
                    .filter(s -> row.equalsIgnoreCase(s.getRow()))
                    .sorted(Comparator.comparingInt(Seat::getNumber))
                    .collect(Collectors.toList());

            int availableStreak = 0;
            for (Seat seat : rowSeats) {
                boolean isTaken = selectedCodes.contains(seat.getSeatCode().toUpperCase())
                        || "BOOKED".equalsIgnoreCase(seat.getStatus())
                        || ("LOCKED".equalsIgnoreCase(seat.getStatus())
                            && seat.getLockedUntil() != null
                            && seat.getLockedUntil().isAfter(now));

                if (!isTaken) {
                    availableStreak++;
                } else {
                    if (availableStreak == 1) {
                        throw new OrphanSeatException("Không được để trống 1 ghế lẻ bên cạnh hoặc ở giữa");
                    }
                    availableStreak = 0;
                }
            }
            // Kiểm tra bìa phải (giữa ghế đã chọn/đã đặt và tường phải WALL)
            if (availableStreak == 1) {
                throw new OrphanSeatException("Không được để trống 1 ghế lẻ bên cạnh hoặc ở giữa");
            }
        }
    }

    /**
     * Thuật toán 4: Áp dụng Mã giảm giá (Apply Voucher) cho đơn hàng PENDING hoặc tính thử trên giỏ hàng
     */
    public BookingSummaryResponse applyVoucher(ApplyVoucherRequest request, User currentUser) {
        Voucher voucher = voucherService.getVoucherByCode(request.getVoucherCode());

        Booking targetBooking = null;
        if (request.getBookingId() != null && !request.getBookingId().isBlank()) {
            targetBooking = bookingRepository.findById(request.getBookingId().trim())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với ID: " + request.getBookingId()));
        } else if (currentUser != null) {
            Optional<Booking> latestPending = bookingRepository
                    .findFirstByUserIdAndStatusOrderByCreatedAtDesc(currentUser.getId(), "PENDING");
            if (latestPending.isPresent() && latestPending.get().getExpiresAt().isAfter(LocalDateTime.now())) {
                targetBooking = latestPending.get();
            }
        }

        if (targetBooking != null) {
            if (!"PENDING".equalsIgnoreCase(targetBooking.getStatus())) {
                throw new BadRequestException("Chỉ có thể áp dụng mã giảm giá cho đơn hàng đang chờ thanh toán (PENDING)");
            }
            if (targetBooking.getExpiresAt() != null && targetBooking.getExpiresAt().isBefore(LocalDateTime.now())) {
                throw new BadRequestException("Đơn hàng đã hết thời gian giữ ghế (10 phút)");
            }

            double originalAmount = targetBooking.getOriginalAmount();
            double discountAmount = voucherService.validateAndCalculateDiscount(voucher, originalAmount);
            double finalAmount = Math.max(0.0, originalAmount - discountAmount);

            targetBooking.setVoucherCode(voucher.getCode());
            targetBooking.setDiscountAmount(discountAmount);
            targetBooking.setFinalAmount(finalAmount);
            targetBooking = bookingRepository.save(targetBooking);

            return toSummaryResponse(targetBooking);
        }

        // Trường hợp preview mã giảm giá trên UI trước khi bấm giữ ghế (dựa trên originalAmount truyền lên)
        double originalAmount = request.getOriginalAmount() != null ? request.getOriginalAmount() : 0.0;
        if (originalAmount <= 0) {
            throw new BadRequestException("Vui lòng chọn ghế hoặc truyền bookingId / originalAmount để áp dụng Voucher");
        }

        double discountAmount = voucherService.validateAndCalculateDiscount(voucher, originalAmount);
        double finalAmount = Math.max(0.0, originalAmount - discountAmount);

        return BookingSummaryResponse.builder()
                .originalAmount(originalAmount)
                .voucherCode(voucher.getCode())
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .status("PREVIEW")
                .build();
    }

    public List<Booking> getMyBookings(String userId) {
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAll();
    }

    public Booking getBookingById(String id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn đặt vé với ID: " + id));
    }

    public void releaseExpiredLocksAtomically(String showtimeId, LocalDateTime now) {
        Query cleanupQuery = new Query(Criteria.where("_id").is(showtimeId)
                .and("seats").elemMatch(
                        Criteria.where("status").is("LOCKED").and("lockedUntil").lt(now)
                ));
        Update cleanupUpdate = new Update()
                .set("seats.$[exp].status", "AVAILABLE")
                .set("seats.$[exp].lockedBy", null)
                .set("seats.$[exp].lockedUntil", null)
                .filterArray(Criteria.where("exp.status").is("LOCKED").and("exp.lockedUntil").lt(now));

        mongoTemplate.updateFirst(cleanupQuery, cleanupUpdate, Showtime.class);
    }

    public BookingSummaryResponse toSummaryResponse(Booking booking) {
        return BookingSummaryResponse.builder()
                .id(booking.getId())
                .bookingId(booking.getId())
                .userId(booking.getUserId())
                .userEmail(booking.getUserEmail())
                .customerName(booking.getCustomerName())
                .customerPhone(booking.getCustomerPhone())
                .showtimeId(booking.getShowtimeId())
                .movieId(booking.getMovieId())
                .movieTitle(booking.getMovieTitle())
                .roomName(booking.getRoomName())
                .format(booking.getFormat())
                .startTime(booking.getStartTime())
                .seatCodes(booking.getSeatCodes())
                .seats(booking.getSeats())
                .originalAmount(booking.getOriginalAmount())
                .voucherCode(booking.getVoucherCode())
                .discountAmount(booking.getDiscountAmount())
                .finalAmount(booking.getFinalAmount())
                .status(booking.getStatus())
                .qrCode(booking.getQrCode())
                .createdAt(booking.getCreatedAt())
                .expiresAt(booking.getExpiresAt())
                .paidAt(booking.getPaidAt())
                .checkedInAt(booking.getCheckedInAt())
                .build();
    }
}

