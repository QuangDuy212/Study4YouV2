package com.study4you.toeic.question.entity;

import com.study4you.common.entity.BaseEntity;
import com.study4you.toeic.part.entity.ToeicPart;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import com.study4you.toeic.option.entity.ToeicOption;
import com.study4you.common.enums.Level;

import java.util.UUID;

@Entity
@Table(name = "toeic_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ToeicQuestion extends BaseEntity {

    @Column(nullable = false)
    private UUID partId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "partId", insertable = false, updatable = false)
    private ToeicPart part;

    @Column(columnDefinition = "TEXT")
    private String content;

    private String audioUrl;

    private String imageUrl;

    @Column(columnDefinition = "TEXT")
    private String passage;

    @Column(nullable = false, length = 1)
    private String correctAnswer;

    @Enumerated(EnumType.STRING)
    private Level level;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @OneToMany(mappedBy = "question", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ToeicOption> options;
}
