package com.study4you.role.repository;

import com.study4you.role.entity.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface RoleRepository extends JpaRepository<Role, UUID> {
    Optional<Role> findByName(String name);
    boolean existsByName(String name);
    org.springframework.data.domain.Page<Role> findAllByActive(Boolean active, org.springframework.data.domain.Pageable pageable);
    void deleteAllByDeletedAtBefore(java.time.LocalDateTime dateTime);
}
