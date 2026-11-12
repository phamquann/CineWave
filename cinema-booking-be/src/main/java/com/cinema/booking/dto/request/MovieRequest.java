package com.cinema.booking.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MovieRequest {
    @NotBlank(message = "Tên phim không được để trống")
    private String title;

    private String tagline;

    private String synopsis;

    private String director;

    private List<String> cast;

    private List<String> genres;

    private List<String> formats;

    @Min(value = 30, message = "Thời lượng phim tối thiểu là 30 phút")
    private int durationMinutes = 120;

    @NotBlank(message = "Phân loại độ tuổi không được để trống")
    @Pattern(regexp = "^(P|T13|T16|T18)$", message = "Phân loại độ tuổi phải thuộc: P, T13, T16, T18")
    private String ageRating = "T13";

    @NotBlank(message = "Trạng thái phim không được để trống")
    @Pattern(regexp = "^(COMING_SOON|NOW_SHOWING|ENDED)$", message = "Trạng thái phim phải thuộc: COMING_SOON, NOW_SHOWING, ENDED")
    private String status = "NOW_SHOWING";

    private Double rating;

    private String posterUrl;

    private String backdropUrl;

    private String trailerVideoUrl;

    private String themeColor;

    private String accentColor;

    private Boolean featured;
}

