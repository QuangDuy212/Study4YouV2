package com.study4you.toeic.test.entity;

import com.study4you.common.entity.BaseEntity;
import com.study4you.common.enums.Level;
import com.study4you.common.enums.Skill;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import com.study4you.toeic.part.entity.ToeicPart;
import com.study4you.toeic.attempt.entity.ToeicAttempt;

@Entity
@Table(name = "toeic_tests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ToeicTest extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private Integer durationMinutes = 120;

    @Column(nullable = false)
    private Boolean active = true;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Skill skill = Skill.FULL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Level level = Level.MEDIUM;

    private String audioUrl;

    @OneToMany(mappedBy = "test", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ToeicPart> parts;

    @OneToMany(mappedBy = "test", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ToeicAttempt> attempts;
}
