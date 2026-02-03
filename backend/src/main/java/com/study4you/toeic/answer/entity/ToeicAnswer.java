package com.study4you.toeic.answer.entity;

import com.study4you.common.entity.BaseEntity;
import com.study4you.toeic.attempt.entity.ToeicAttempt;
import com.study4you.toeic.question.entity.ToeicQuestion;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "toeic_answers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ToeicAnswer extends BaseEntity {

    @Column(nullable = false)
    private UUID attemptId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "attemptId", insertable = false, updatable = false)
    private ToeicAttempt attempt;

    @Column(nullable = false)
    private UUID questionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "questionId", insertable = false, updatable = false)
    private ToeicQuestion question;

    @Column(length = 1)
    private String selectedOption;

    @Column(nullable = false)
    private Boolean correct;
}
