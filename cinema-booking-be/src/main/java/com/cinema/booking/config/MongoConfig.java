package com.cinema.booking.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.EnableMongoAuditing;

@Configuration
@EnableMongoAuditing
public class MongoConfig {
    // Cấu hình bổ sung cho MongoDB (sử dụng Atomic Operations qua MongoTemplate cho Standalone & Replica Set)
}

