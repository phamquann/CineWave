package com.cinema.booking.repository;

import com.cinema.booking.model.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends MongoRepository<Booking, String> {
    List<Booking> findByUserIdOrderByCreatedAtDesc(String userId);
    List<Booking> findByStatusAndExpiresAtBefore(String status, LocalDateTime now);
    Optional<Booking> findByQrCode(String qrCode);
    Optional<Booking> findFirstByUserIdAndStatusOrderByCreatedAtDesc(String userId, String status);
}

