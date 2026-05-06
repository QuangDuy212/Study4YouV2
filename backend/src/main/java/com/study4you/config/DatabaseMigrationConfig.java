package com.study4you.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DatabaseMigrationConfig {

    private final JdbcTemplate jdbcTemplate;

    @EventListener(ApplicationReadyEvent.class)
    public void migrateDatabase() {
        log.info("Starting manual database migration for toeic_answers table...");
        try {
            // Tự động thêm cột is_flagged nếu nó chưa tồn tại
            jdbcTemplate.execute("ALTER TABLE toeic_answers ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN NOT NULL DEFAULT FALSE");
            log.info("Database migration successful: column is_flagged added/verified.");
        } catch (Exception e) {
            log.error("Database migration failed: " + e.getMessage());
        }
    }
}
