package com.study4you.bootstrap;

import com.study4you.common.enums.PartNumber;
import com.study4you.common.enums.UserStatus;
import com.study4you.permission.entity.Permission;
import com.study4you.permission.repository.PermissionRepository;
import com.study4you.role.entity.Role;
import com.study4you.role.repository.RoleRepository;
import com.study4you.toeic.option.entity.ToeicOption;
import com.study4you.toeic.option.repository.ToeicOptionRepository;
import com.study4you.toeic.part.entity.ToeicPart;
import com.study4you.toeic.part.repository.ToeicPartRepository;
import com.study4you.toeic.question.entity.ToeicQuestion;
import com.study4you.toeic.question.repository.ToeicQuestionRepository;
import com.study4you.toeic.test.entity.ToeicTest;
import com.study4you.toeic.test.repository.ToeicTestRepository;
import com.study4you.user.entity.User;
import com.study4you.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final ToeicTestRepository toeicTestRepository;
    private final ToeicPartRepository toeicPartRepository;
    private final ToeicQuestionRepository toeicQuestionRepository;
    private final ToeicOptionRepository toeicOptionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0 || toeicTestRepository.count() > 0) {
            log.info("Database already seeded. Skipping data seeder.");
            return;
        }

        log.info("Starting data seeding...");

        // 1. Seed Permissions
        Map<String, Permission> permissions = seedPermissions();

        // 2. Seed Roles
        Map<String, Role> roles = seedRoles(permissions);

        // 3. Seed Users
        seedUsers(roles);

        // 4. Seed TOEIC Tests
        seedToeicTests();

        log.info("Data seeding completed successfully!");
    }

    private Map<String, Permission> seedPermissions() {
        log.info("Seeding permissions...");
        Map<String, Permission> permissionMap = new HashMap<>();

        String[] permissionNames = {
                "MANAGE_USERS", "MANAGE_TESTS", "VIEW_ADMIN_DASHBOARD", "TAKE_TOEIC_TEST"
        };

        for (String name : permissionNames) {
            Permission permission = new Permission();
            permission.setName(name);
            
            List<String> routes = new ArrayList<>();
            if (name.contains("MANAGE")) {
                routes.add("/admin/**");
            } else if (name.equals("VIEW_ADMIN_DASHBOARD")) {
                routes.add("/admin/dashboard");
            } else {
                routes.add("/student/**");
            }
            permission.setPageAllow(routes);
            
            permissionMap.put(name, permissionRepository.save(permission));
        }

        return permissionMap;
    }

    private Map<String, Role> seedRoles(Map<String, Permission> permissions) {
        log.info("Seeding roles...");
        Map<String, Role> roleMap = new HashMap<>();

        // ADMIN Role
        Role adminRole = new Role();
        adminRole.setName("ADMIN");
        adminRole.setDescription("System Administrator with full access");
        adminRole.setPermissions(new HashSet<>(permissions.values()));
        roleMap.put("ADMIN", roleRepository.save(adminRole));

        // STUDENT Role
        Role studentRole = new Role();
        studentRole.setName("STUDENT");
        studentRole.setDescription("Standard user with access to practice tests");
        Set<Permission> studentPerms = new HashSet<>();
        studentPerms.add(permissions.get("TAKE_TOEIC_TEST"));
        studentRole.setPermissions(studentPerms);
        roleMap.put("STUDENT", roleRepository.save(studentRole));

        return roleMap;
    }

    private void seedUsers(Map<String, Role> roles) {
        log.info("Seeding users...");

        // Admin User
        User admin = new User();
        admin.setEmail("admin@study4you.com");
        admin.setFullName("System Admin");
        admin.setPassword(passwordEncoder.encode("admin123"));
        admin.setStatus(UserStatus.ACTIVE);
        admin.setRoles(Collections.singleton(roles.get("ADMIN")));
        userRepository.save(admin);

        // Student Users
        for (int i = 1; i <= 3; i++) {
            User student = new User();
            student.setEmail("student" + i + "@study4you.com");
            student.setFullName("Student User " + i);
            student.setPassword(passwordEncoder.encode("123456"));
            student.setStatus(UserStatus.ACTIVE);
            student.setRoles(Collections.singleton(roles.get("STUDENT")));
            userRepository.save(student);
        }
    }

    private void seedToeicTests() {
        log.info("Seeding TOEIC tests...");
        createFullTest("ETS TOEIC 2024 - Test 1", true);
        createFullTest("ETS TOEIC 2024 - Test 2", true);
    }

    private void createFullTest(String title, boolean active) {
        ToeicTest test = new ToeicTest();
        test.setTitle(title);
        test.setDurationMinutes(120);
        test.setActive(active);
        test = toeicTestRepository.save(test);

        // Standard TOEIC L&R: 7 parts
        seedPart(test, PartNumber.PART_1, 6,  true,  true);   // Photographs
        seedPart(test, PartNumber.PART_2, 25, false, true);   // Question-Response
        seedPart(test, PartNumber.PART_3, 39, false, true);   // Conversations
        seedPart(test, PartNumber.PART_4, 30, false, true);   // Talks
        seedPart(test, PartNumber.PART_5, 30, false, false);  // Incomplete Sentences
        seedPart(test, PartNumber.PART_6, 16, false, false);  // Text Completion
        seedPart(test, PartNumber.PART_7, 54, false, false);  // Reading Comprehension
    }

    private void seedPart(ToeicTest test, PartNumber partNum, int questionCount,
                          boolean hasImage, boolean hasAudio) {
        ToeicPart part = new ToeicPart();
        part.setTestId(test.getId());
        part.setPart(partNum);
        part.setOrderIndex(partNum.ordinal() + 1);
        part = toeicPartRepository.save(part);

        for (int i = 1; i <= questionCount; i++) {
            createQuestion(part, i, hasImage, hasAudio);
        }
    }

    private void createQuestion(ToeicPart part, int index, boolean hasImage, boolean hasAudio) {
        ToeicQuestion question = new ToeicQuestion();
        question.setPartId(part.getId());
        question.setContent("Sample Question " + index + " for " + part.getPart());

        if (hasAudio) {
            question.setAudioUrl("https://example.com/audio/" + part.getPart().name().toLowerCase() + "-" + index + ".mp3");
        }
        if (hasImage) {
            question.setImageUrl("https://example.com/images/" + part.getPart().name().toLowerCase() + "-" + index + ".jpg");
        }
        if (part.getPart() == PartNumber.PART_6 || part.getPart() == PartNumber.PART_7) {
            question.setPassage("This is a sample passage for " + part.getPart() + " question " + index + ".");
        }

        question.setCorrectAnswer("A");
        question = toeicQuestionRepository.save(question);

        // Options A, B, C, D
        String[] labels = {"A", "B", "C", "D"};
        for (String label : labels) {
            ToeicOption option = new ToeicOption();
            option.setQuestionId(question.getId());
            option.setLabel(label);
            option.setContent("Option " + label + " for question " + index);
            toeicOptionRepository.save(option);
        }
    }
}
