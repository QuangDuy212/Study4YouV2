package com.study4you.toeic.attempt.repository;

import com.study4you.toeic.attempt.entity.ToeicAttempt;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ToeicAttemptRepository extends JpaRepository<ToeicAttempt, UUID> {
    Page<ToeicAttempt> findByUserId(UUID userId, Pageable pageable);
    List<ToeicAttempt> findByUserId(UUID userId);
    List<ToeicAttempt> findByTestId(UUID testId);

    @Query(value = "SELECT TO_CHAR(a.created_at, 'YYYY-MM') as month, COUNT(*) as count " +
           "FROM toeic_attempts a " +
           "GROUP BY TO_CHAR(a.created_at, 'YYYY-MM') " +
           "ORDER BY month DESC", nativeQuery = true)
    List<Object[]> countAttemptsByMonth();

    @Query("SELECT COUNT(a) FROM ToeicAttempt a WHERE a.submittedAt IS NOT NULL")
    long countCompletedAttempts();

    @Query("SELECT COUNT(DISTINCT a.userId) FROM ToeicAttempt a WHERE a.createdAt >= CURRENT_DATE")
    long countDailyActiveUsers();

    @Query(value = "SELECT AVG(EXTRACT(EPOCH FROM (a.submitted_at - a.started_at))) / 60 FROM toeic_attempts a WHERE a.submitted_at IS NOT NULL", nativeQuery = true)
    Double getAverageSessionDurationMinutes();

    @Query(value = "SELECT TO_CHAR(a.created_at, 'Dy') as day, COUNT(DISTINCT a.user_id) as active, " +
           "COUNT(CASE WHEN a.submitted_at IS NOT NULL THEN 1 END) as completed " +
           "FROM toeic_attempts a " +
           "WHERE a.created_at >= CURRENT_DATE - INTERVAL '6 days' " +
           "GROUP BY day, DATE(a.created_at) " +
           "ORDER BY DATE(a.created_at) ASC", nativeQuery = true)
    List<Object[]> getDailyEngagement();

    @Query(value = "SELECT 'Week ' || (EXTRACT(WEEK FROM a.created_at) - EXTRACT(WEEK FROM DATE_TRUNC('month', a.created_at)) + 1) as week_label, " +
           "COUNT(DISTINCT a.user_id) as users_count " +
           "FROM toeic_attempts a " +
           "WHERE a.created_at >= CURRENT_DATE - INTERVAL '27 days' " +
           "GROUP BY week_label, DATE_TRUNC('week', a.created_at) " +
           "ORDER BY DATE_TRUNC('week', a.created_at) ASC", nativeQuery = true)
    List<Object[]> getWeeklyActiveUsers();
}
