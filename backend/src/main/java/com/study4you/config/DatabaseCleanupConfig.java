package com.study4you.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Helper configuration to clean up obsolete database constraints
 * that hibernate ddl-auto=update might fail to synchronize.
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class DatabaseCleanupConfig {

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void dropObsoleteConstraints() {
        try {
            // Hibernate generates check constraints for Enums like 'payments_payment_method_check'.
            // When new Enum values (like VIETQR) are added, the old check constraint causes failures.
            log.info("Checking for obsolete constraint 'payments_payment_method_check'...");
            jdbcTemplate.execute("ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_payment_method_check");
            log.info("Constraint cleanup completed successfully.");
        } catch (Exception e) {
            log.warn("Non-critical: Could not drop constraint (might not exist or missing permissions): {}", e.getMessage());
        }
    }
}
