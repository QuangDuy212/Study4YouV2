package com.study4you.course.entity;

import com.study4you.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "lessons")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Lesson extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "section_id")
    private Section section;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String thumbnailUrl;

    private String videoUrl;

    /** Duration in seconds */
    @Builder.Default
    private Integer duration = 0;

    @Column(nullable = false)
    @Builder.Default
    private Integer orderIndex = 0;

    /** True = accessible without enrollment */
    @Column(nullable = false)
    @Builder.Default
    private Boolean isPreview = false;
}
