package com.cinema.booking.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "showtimes")
public class Showtime {
    @Id
    private String id;

    private String movieId;

    private String movieTitle;

    /**
     * Phòng chiếu: Cinema 01, Cinema 02, ...
     */
    private String roomName;

    /**
     * Định dạng chiếu: IMAX, Dolby Atmos, 3D, 4DX, VIP
     */
    @Builder.Default
    private String format = "IMAX";

    private LocalDateTime startTime;

    /**
     * endTime = startTime + durationMinutes + 15 phút (dọn phòng)
     */
    private LocalDateTime endTime;

    private double basePrice;

    /**
     * Danh sách 40-60 ghế nhúng bên trong suất chiếu
     */
    @Builder.Default
    private List<Seat> seats = new ArrayList<>();

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}

