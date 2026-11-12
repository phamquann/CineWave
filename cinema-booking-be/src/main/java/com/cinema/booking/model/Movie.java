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
@Document(collection = "movies")
public class Movie {
    @Id
    private String id;

    private String title;

    private String tagline;

    private String synopsis;

    private String director;

    @Builder.Default
    private List<String> cast = new ArrayList<>();

    @Builder.Default
    private List<String> genres = new ArrayList<>();

    @Builder.Default
    private List<String> formats = new ArrayList<>();

    private int durationMinutes;

    /**
     * Phân loại độ tuổi: P, T13, T16, T18
     */
    private String ageRating;

    /**
     * Trạng thái: COMING_SOON, NOW_SHOWING, ENDED
     */
    private String status;

    @Builder.Default
    private double rating = 9.0;

    @Builder.Default
    private String votesCount = "15.2k";

    @Builder.Default
    private String themeColor = "#4F46E5";

    @Builder.Default
    private String accentColor = "#818CF8";

    @Builder.Default
    private boolean featured = false;

    private String posterUrl;

    private String backdropUrl;

    private String trailerVideoUrl;

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}

