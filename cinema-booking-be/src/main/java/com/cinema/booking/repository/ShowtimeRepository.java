package com.cinema.booking.repository;

import com.cinema.booking.model.Showtime;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShowtimeRepository extends MongoRepository<Showtime, String> {
    List<Showtime> findByMovieIdOrderByStartTimeAsc(String movieId);
    List<Showtime> findByRoomName(String roomName);
}

