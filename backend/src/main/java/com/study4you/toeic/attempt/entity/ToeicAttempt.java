package com.study4you.toeic.attempt.entity;

import com.study4you.common.entity.BaseEntity;
import com.study4you.toeic.test.entity.ToeicTest;
import com.study4you.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import com.study4you.toeic.answer.entity.ToeicAnswer;

@Entity
@Table(name = "toeic_attempts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ToeicAttempt extends BaseEntity {

    @Column(nullable = false)
    private UUID userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId", insertable = false, updatable = false)
    private User user;

    @Column(nullable = false)
    private UUID testId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "testId", insertable = false, updatable = false)
    private ToeicTest test;

    @Column(nullable = false)
    private LocalDateTime startedAt;

    private LocalDateTime submittedAt;

    private Integer rawScore;

    private Integer toeicScore;

    @OneToMany(mappedBy = "attempt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ToeicAnswer> answers;
}
