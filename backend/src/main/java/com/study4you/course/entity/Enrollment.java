package com.study4you.course.entity;

import com.study4you.common.entity.BaseEntity;
import com.study4you.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
    name = "enrollments",
    uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "course_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Enrollment extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    /** Progress percentage 0-100 */
    @Column(nullable = false)
    @Builder.Default
    private Integer progress = 0;
}
