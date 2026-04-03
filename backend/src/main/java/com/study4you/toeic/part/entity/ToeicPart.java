package com.study4you.toeic.part.entity;

import com.study4you.common.entity.BaseEntity;
import com.study4you.common.enums.PartNumber;
import com.study4you.toeic.test.entity.ToeicTest;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import com.study4you.toeic.question.entity.ToeicQuestion;
import java.util.UUID;

@Entity
@Table(name = "toeic_parts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ToeicPart extends BaseEntity {

    @Column(nullable = false)
    private UUID testId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "testId", insertable = false, updatable = false)
    private ToeicTest test;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PartNumber part;

    @Column(nullable = false)
    private Integer orderIndex;

    @OneToMany(mappedBy = "part", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ToeicQuestion> questions;
}
