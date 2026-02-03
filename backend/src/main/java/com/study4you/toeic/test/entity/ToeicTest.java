package com.study4you.toeic.test.entity;

import com.study4you.common.entity.BaseEntity;
import com.study4you.common.enums.Level;
import com.study4you.common.enums.Skill;
import com.study4you.common.enums.TestType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "toeic_tests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ToeicTest extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TestType testType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Skill skill;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Level level;

    @Column(nullable = false)
    private Integer durationMinutes;

    @Column(nullable = false)
    private Boolean active = true;
}
