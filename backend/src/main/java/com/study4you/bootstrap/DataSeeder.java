package com.study4you.bootstrap;

import com.study4you.common.enums.*;
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

        // 1. FULL LISTENING TEST
        createTest("TOEIC Full Practice - Listening Vol 1", TestType.FULL_TEST, Skill.LISTENING, Level.MEDIUM, 45, true);

        // 2. FULL READING TEST
        createTest("TOEIC Full Practice - Reading Vol 1", TestType.FULL_TEST, Skill.READING, Level.MEDIUM, 75, true);

        // 3. MINI TEST
        createTest("Quick Mini Test - Mixed Skills", TestType.MINI_TEST, Skill.LISTENING, Level.EASY, 30, true);
    }

    private void createTest(String title, TestType type, Skill skill, Level level, int duration, boolean active) {
        ToeicTest test = new ToeicTest();
        test.setTitle(title);
        test.setTestType(type);
        test.setSkill(skill);
        test.setLevel(level);
        test.setDurationMinutes(duration);
        test.setActive(active);
        test = toeicTestRepository.save(test);

        if (skill == Skill.LISTENING) {
            // Listening: Part 1 to 4
            seedPart(test, PartNumber.PART_1, 6);
            seedPart(test, PartNumber.PART_2, 10);
            seedPart(test, PartNumber.PART_3, 9);
            seedPart(test, PartNumber.PART_4, 9);
        } else if (skill == Skill.READING) {
            // Reading: Part 5 to 7
            seedPart(test, PartNumber.PART_5, 10);
            seedPart(test, PartNumber.PART_6, 4);
            seedPart(test, PartNumber.PART_7, 10);
        }
    }

    private void seedPart(ToeicTest test, PartNumber partNum, int questionCount) {
        ToeicPart part = new ToeicPart();
        part.setTestId(test.getId());
        part.setPart(partNum);
        part.setOrderIndex(partNum.ordinal());
        part = toeicPartRepository.save(part);

        for (int i = 1; i <= questionCount; i++) {
            createQuestion(part, i);
        }
    }

    private void createQuestion(ToeicPart part, int index) {
        ToeicQuestion question = new ToeicQuestion();
        question.setPartId(part.getId());
        question.setContent("Sample Question " + index + " for " + part.getPart());
        
        if (part.getPart().ordinal() < 4) { // Listening Part 1-4
            question.setAudioUrl("https://example.com/audio/test-" + part.getPart() + "-" + index + ".mp3");
        }
        
        if (part.getPart() == PartNumber.PART_7) {
            question.setPassage("This is a sample reading passage for Part 7. It contains information related to the question.");
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
