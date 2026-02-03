package com.study4you.toeic.option.entity;

import com.study4you.common.entity.BaseEntity;
import com.study4you.toeic.question.entity.ToeicQuestion;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "toeic_options")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ToeicOption extends BaseEntity {

    @Column(nullable = false)
    private UUID questionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "questionId", insertable = false, updatable = false)
    private ToeicQuestion question;

    @Column(nullable = false, length = 1)
    private String label;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;
}
