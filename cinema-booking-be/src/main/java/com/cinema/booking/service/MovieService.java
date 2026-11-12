package com.cinema.booking.service;

import com.cinema.booking.dto.request.MovieRequest;
import com.cinema.booking.exception.ResourceNotFoundException;
import com.cinema.booking.model.Movie;
import com.cinema.booking.repository.MovieRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MovieService {

    private final MovieRepository movieRepository;

    public List<Movie> getAllMovies(String status) {
        if (status != null && !status.isBlank()) {
            return movieRepository.findByStatus(status.trim().toUpperCase());
        }
        return movieRepository.findAll();
    }

    public Movie getMovieById(String id) {
        return movieRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy phim với ID: " + id));
    }

    public Movie createMovie(MovieRequest request) {
        Movie movie = Movie.builder()
                .title(request.getTitle().trim())
                .tagline(request.getTagline() != null ? request.getTagline() : "")
                .synopsis(request.getSynopsis() != null ? request.getSynopsis() : "")
                .director(request.getDirector() != null ? request.getDirector() : "Đạo diễn")
                .cast(request.getCast() != null ? request.getCast() : List.of())
                .genres(request.getGenres() != null ? request.getGenres() : List.of("Action", "Sci-Fi"))
                .formats(request.getFormats() != null ? request.getFormats() : List.of("IMAX", "Dolby Atmos"))
                .durationMinutes(request.getDurationMinutes())
                .ageRating(request.getAgeRating().toUpperCase())
                .status(request.getStatus().toUpperCase())
                .rating(request.getRating() != null ? request.getRating() : 9.0)
                .posterUrl(request.getPosterUrl())
                .backdropUrl(request.getBackdropUrl())
                .trailerVideoUrl(request.getTrailerVideoUrl())
                .themeColor(request.getThemeColor() != null ? request.getThemeColor() : "#4F46E5")
                .accentColor(request.getAccentColor() != null ? request.getAccentColor() : "#818CF8")
                .featured(request.getFeatured() != null && request.getFeatured())
                .createdAt(LocalDateTime.now())
                .build();
        return movieRepository.save(movie);
    }

    public Movie updateMovie(String id, MovieRequest request) {
        Movie movie = getMovieById(id);
        movie.setTitle(request.getTitle().trim());
        if (request.getTagline() != null) movie.setTagline(request.getTagline());
        if (request.getSynopsis() != null) movie.setSynopsis(request.getSynopsis());
        if (request.getDirector() != null) movie.setDirector(request.getDirector());
        if (request.getCast() != null) movie.setCast(request.getCast());
        if (request.getGenres() != null) movie.setGenres(request.getGenres());
        if (request.getFormats() != null) movie.setFormats(request.getFormats());
        movie.setDurationMinutes(request.getDurationMinutes());
        movie.setAgeRating(request.getAgeRating().toUpperCase());
        movie.setStatus(request.getStatus().toUpperCase());
        if (request.getRating() != null) movie.setRating(request.getRating());
        if (request.getPosterUrl() != null) movie.setPosterUrl(request.getPosterUrl());
        if (request.getBackdropUrl() != null) movie.setBackdropUrl(request.getBackdropUrl());
        if (request.getTrailerVideoUrl() != null) movie.setTrailerVideoUrl(request.getTrailerVideoUrl());
        if (request.getThemeColor() != null) movie.setThemeColor(request.getThemeColor());
        if (request.getAccentColor() != null) movie.setAccentColor(request.getAccentColor());
        if (request.getFeatured() != null) movie.setFeatured(request.getFeatured());
        return movieRepository.save(movie);
    }

    public void deleteMovie(String id) {
        Movie movie = getMovieById(id);
        movieRepository.delete(movie);
    }
}

