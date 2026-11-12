package com.cinema.booking.service;

import com.cinema.booking.dto.request.CreateShowtimeRequest;
import com.cinema.booking.exception.ResourceNotFoundException;
import com.cinema.booking.exception.SeatConflictException;
import com.cinema.booking.model.Booking;
import com.cinema.booking.model.Movie;
import com.cinema.booking.model.Seat;
import com.cinema.booking.model.Showtime;
import com.cinema.booking.repository.BookingRepository;
import com.cinema.booking.repository.MovieRepository;
import com.cinema.booking.repository.ShowtimeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ShowtimeService {

    private final ShowtimeRepository showtimeRepository;
    private final MovieRepository movieRepository;
    private final BookingRepository bookingRepository;

    /**
     * Thuật toán 1: Kiểm tra Trùng lịch Phòng chiếu (Interval Overlap Algorithm)
     * isOverlapping = (NewStart < ExistingEnd) && (NewEnd > ExistingStart)
     * Tự động tính endTime = startTime + durationMinutes + 15 phút (dọn phòng)
     * Tự động sinh 56 ghế (40-60 ghế):
     * - STANDARD (hàng A-C): basePrice
     * - VIP (hàng D-F): basePrice + 20.000đ
     * - COUPLE (hàng G): basePrice * 2 + 20.000đ (nhân đôi giá gốc + phụ thu)
     */
    public Showtime createShowtime(CreateShowtimeRequest request) {
        Movie movie = movieRepository.findById(request.getMovieId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phim với ID: " + request.getMovieId()));

        LocalDateTime newStart = request.getStartTime();
        LocalDateTime newEnd = newStart.plusMinutes(movie.getDurationMinutes() + 15L);

        String roomName = request.getRoomName().trim();
        List<Showtime> existingShowtimes = showtimeRepository.findByRoomName(roomName);

        for (Showtime existing : existingShowtimes) {
            boolean isOverlapping = newStart.isBefore(existing.getEndTime())
                    && newEnd.isAfter(existing.getStartTime());
            if (isOverlapping) {
                throw new SeatConflictException("Phòng chiếu đã có lịch trong khung giờ này");
            }
        }

        List<Seat> seats = generateSeats(request.getBasePrice());

        Showtime showtime = Showtime.builder()
                .movieId(movie.getId())
                .movieTitle(movie.getTitle())
                .roomName(roomName)
                .format(request.getFormat() != null && !request.getFormat().isBlank() ? request.getFormat().trim() : "IMAX")
                .startTime(newStart)
                .endTime(newEnd)
                .basePrice(request.getBasePrice())
                .seats(seats)
                .createdAt(LocalDateTime.now())
                .build();

        return showtimeRepository.save(showtime);
    }

    public List<Seat> generateSeats(double basePrice) {
        List<Seat> seats = new ArrayList<>();
        String[] rows = {"A", "B", "C", "D", "E", "F", "G"};
        int seatsPerRow = 8; // 7 hàng x 8 ghế = 56 ghế (nằm trong khoảng 40-60 ghế)

        for (String row : rows) {
            String type;
            double surcharge;

            if (row.equals("A") || row.equals("B") || row.equals("C")) {
                type = "STANDARD";
                surcharge = 0.0;
            } else if (row.equals("D") || row.equals("E") || row.equals("F")) {
                type = "VIP";
                surcharge = 20000.0;
            } else {
                // Hàng G: COUPLE (nhân đôi giá gốc + phụ thu 20.000đ)
                type = "COUPLE";
                surcharge = basePrice + 20000.0;
            }

            double seatPrice = basePrice + surcharge;

            for (int num = 1; num <= seatsPerRow; num++) {
                seats.add(Seat.builder()
                        .seatCode(row + num)
                        .row(row)
                        .number(num)
                        .type(type)
                        .surcharge(surcharge)
                        .price(seatPrice)
                        .status("AVAILABLE")
                        .lockedBy(null)
                        .lockedUntil(null)
                        .build());
            }
        }
        return seats;
    }

    public List<Showtime> getAllShowtimes(String movieId) {
        List<Showtime> showtimes = (movieId != null && !movieId.isBlank())
                ? showtimeRepository.findByMovieIdOrderByStartTimeAsc(movieId.trim())
                : showtimeRepository.findAll();

        showtimes.forEach(this::applyLazyExpirationCheck);
        return showtimes;
    }

    public Showtime getShowtimeById(String id) {
        Showtime showtime = showtimeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy suất chiếu với ID: " + id));
        return applyLazyExpirationCheck(showtime);
    }

    /**
     * Thuật toán 5 (Lazy Check):
     * Ngay khi có người gọi API xem sơ đồ ghế hoặc đặt ghế, những ghế có status == "LOCKED"
     * nhưng lockedUntil < now sẽ được giải phóng về AVAILABLE.
     */
    public Showtime applyLazyExpirationCheck(Showtime showtime) {
        LocalDateTime now = LocalDateTime.now();
        boolean modified = false;

        if (showtime.getSeats() != null) {
            for (Seat seat : showtime.getSeats()) {
                if ("LOCKED".equalsIgnoreCase(seat.getStatus())
                        && seat.getLockedUntil() != null
                        && seat.getLockedUntil().isBefore(now)) {
                    seat.setStatus("AVAILABLE");
                    seat.setLockedBy(null);
                    seat.setLockedUntil(null);
                    modified = true;
                }
            }
        }

        if (modified) {
            showtime = showtimeRepository.save(showtime);
            // Đồng bộ các đơn hàng PENDING đã quá hạn sang EXPIRED
            List<Booking> expiredBookings = bookingRepository.findByStatusAndExpiresAtBefore("PENDING", now);
            for (Booking booking : expiredBookings) {
                booking.setStatus("EXPIRED");
                bookingRepository.save(booking);
            }
        }

        return showtime;
    }

    public void deleteShowtime(String id) {
        Showtime showtime = getShowtimeById(id);
        showtimeRepository.delete(showtime);
    }
}

