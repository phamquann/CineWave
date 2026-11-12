package com.cinema.booking.repository;

import com.cinema.booking.model.Voucher;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VoucherRepository extends MongoRepository<Voucher, String> {
    Optional<Voucher> findByCodeIgnoreCase(String code);
    boolean existsByCodeIgnoreCase(String code);
}

