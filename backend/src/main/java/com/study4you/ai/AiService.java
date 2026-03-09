package com.study4you.ai;

import com.study4you.ai.dto.GeneratedQuestionResponse;
import com.study4you.ai.dto.GeneratedQuestionResponse.OptionDto;
import com.study4you.ai.dto.GeneratedUserResponse;
import com.study4you.common.enums.Level;
import com.study4you.common.enums.UserStatus;
import com.study4you.common.exception.BadRequestException;
import com.study4you.common.exception.ResourceNotFoundException;
import com.study4you.role.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    private final RoleRepository roleRepository;
    private final GeminiClient geminiClient;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    // ─── Vietnamese name pools ────────────────────────────────────────────────

    private static final List<String> LAST_NAMES = List.of(
            "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh",
            "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương"
    );

    private static final List<String> MIDDLE_NAMES = List.of(
            "Văn", "Thị", "Hữu", "Ngọc", "Minh", "Thanh", "Quốc", "Đức"
    );

    private static final List<String> FIRST_NAMES = List.of(
            "An", "Bình", "Châu", "Dũng", "Hà", "Hùng", "Lan", "Linh",
            "Mai", "Nam", "Phú", "Quân", "Thảo", "Trang", "Tuấn",
            "Uyên", "Vinh", "Xuân", "Yến", "Phong"
    );

    // ─── Mock question templates ──────────────────────────────────────────────

    private static final String PART5_PASSAGE_TEMPLATE =
            "The company _____ its annual report last month. (difficulty: %s)";
    private static final String PART6_PASSAGE =
            "Memo\n\nTo: All Staff\nFrom: HR Department\n\n" +
            "Please be advised that the office will be _____ on Friday due to scheduled maintenance. " +
            "All employees are expected to work remotely and remain _____ during regular business hours.";
    private static final String PART7_PASSAGE =
            "Advertisement\n\n" +
            "Sunrise Tech is looking for a motivated Software Engineer to join our growing team. " +
            "The ideal candidate will have at least two years of experience in Java development. " +
            "We offer competitive salaries, flexible working hours, and an excellent benefits package. " +
            "Interested applicants should send their resumes to careers@sunrisetech.com by March 15.";

    // ─────────────────────────────────────────────────────────────────────────

    public List<GeneratedQuestionResponse> generateReadingQuestions(
            String part, String difficulty, int count) {

        validatePart(part);
        validateDifficulty(difficulty);

        if (geminiClient.isAvailable()) {
            try {
                String prompt = buildQuestionPrompt(part, difficulty, count);
                String response = geminiClient.generate(prompt);
                String json = extractJson(response);
                return objectMapper.readValue(json, new com.fasterxml.jackson.core.type.TypeReference<List<GeneratedQuestionResponse>>() {});
            } catch (Exception e) {
                log.error("Gemini question generation failed, falling back to mock: {}", e.getMessage());
            }
        }

        List<GeneratedQuestionResponse> result = new ArrayList<>();
        for (int i = 1; i <= count; i++) {
            result.add(buildQuestion(part, difficulty, i));
        }
        return result;
    }

    public List<GeneratedUserResponse> generateUsers(
            int count, UUID defaultRoleId, String status) {

        validateStatus(status);

        UUID safeRoleId = Objects.requireNonNull(defaultRoleId, "defaultRoleId must not be null");
        roleRepository.findById(safeRoleId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Role not found with id: " + safeRoleId));

        if (geminiClient.isAvailable()) {
            try {
                String prompt = buildUserPrompt(count);
                String response = geminiClient.generate(prompt);
                String json = extractJson(response);
                List<GeneratedUserResponse> aiUsers = objectMapper.readValue(json, new com.fasterxml.jackson.core.type.TypeReference<List<GeneratedUserResponse>>() {});
                
                aiUsers.forEach(u -> {
                    u.setRoleId(safeRoleId);
                    u.setStatus(status);
                    if (u.getPassword() == null) u.setPassword("Study4You@2025");
                });
                return aiUsers;
            } catch (Exception e) {
                log.error("Gemini user generation failed, falling back to mock: {}", e.getMessage());
            }
        }

        Random random = new Random();
        Set<String> usedEmails = new HashSet<>();
        List<GeneratedUserResponse> result = new ArrayList<>();

        for (int i = 0; i < count; i++) {
            String lastName  = LAST_NAMES.get(random.nextInt(LAST_NAMES.size()));
            String middleName = MIDDLE_NAMES.get(random.nextInt(MIDDLE_NAMES.size()));
            String firstName = FIRST_NAMES.get(random.nextInt(FIRST_NAMES.size()));
            String fullName  = lastName + " " + middleName + " " + firstName;

            String baseEmail = removeDiacritics(firstName).toLowerCase() + (i + 1);
            String email = baseEmail + "@study4you.vn";
            int suffix = 2;
            while (usedEmails.contains(email)) {
                email = baseEmail + suffix + "@study4you.vn";
                suffix++;
            }
            usedEmails.add(email);

            result.add(GeneratedUserResponse.builder()
                    .name(fullName)
                    .email(email)
                    .password("Study4You@2025")
                    .roleId(safeRoleId)
                    .status(status)
                    .build());
        }
        return result;
    }

    public com.study4you.ai.dto.ChatResponse chat(String message) {
        if (geminiClient.isAvailable()) {
            try {
                String prompt = "You are a helpful study assistant for Study4You, an online TOEIC practice platform. " +
                        "Answer the user's question concisely and helpfully.\n\nUser: " + message;
                String reply = geminiClient.generate(prompt);
                return com.study4you.ai.dto.ChatResponse.builder().reply(reply).build();
            } catch (Exception e) {
                log.error("Gemini chat failed: {}", e.getMessage());
            }
        }

        // Fallback or simple logic
        return com.study4you.ai.dto.ChatResponse.builder()
                .reply("I'm currently in basic mode. How can I help you with your TOEIC studies?")
                .build();
    }

    private String buildQuestionPrompt(String part, String difficulty, int count) {
        return String.format(
            "You are a professional TOEIC test designer. Generate exactly %d TOEIC %s questions " +
            "at %s difficulty level in a strict JSON array format.\n" +
            "Each object must have:\n" +
            "  \"content\": string (the question stem, use _____ for blanks),\n" +
            "  \"passage\": string or null (null for PART_5, a short text for PART_6, a relevant article/email for PART_7),\n" +
            "  \"correctAnswer\": exactly one of \"A\", \"B\", \"C\", \"D\",\n" +
            "  \"options\": an array of 4 objects, each with \"label\" (\"A\"-\"D\") and \"content\".\n" +
            "Return ONLY the JSON. No markdown backticks. No explanation.",
            count, part, difficulty
        );
    }

    private String buildUserPrompt(int count) {
        return String.format(
            "Generate exactly %d realistic Vietnamese full names and unique email addresses.\n" +
            "Return a strict JSON array. Each object must have:\n" +
            "  \"name\": full Vietnamese name (e.g., \"Nguyen Van An\"),\n" +
            "  \"email\": a lowercase email string ending with @study4you.vn based on the name.\n" +
            "Return ONLY the JSON. No markdown backticks.",
            count
        );
    }

    private String extractJson(String text) {
        if (text.contains("```json")) {
            return text.substring(text.indexOf("```json") + 7, text.lastIndexOf("```")).trim();
        } else if (text.contains("```")) {
            return text.substring(text.indexOf("```") + 3, text.lastIndexOf("```")).trim();
        }
        return text.trim();
    }

    // ─── Validation ──────────────────────────────────────────────────────────

    private void validatePart(String part) {
        List<String> allowed = List.of("PART_5", "PART_6", "PART_7");
        if (!allowed.contains(part)) {
            throw new BadRequestException(
                    "Only Reading parts are allowed: PART_5, PART_6, PART_7. Got: " + part);
        }
    }

    private void validateDifficulty(String difficulty) {
        try {
            Level.valueOf(difficulty);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(
                    "Invalid difficulty. Allowed values: EASY, MEDIUM, HARD. Got: " + difficulty);
        }
    }

    private void validateStatus(String status) {
        try {
            UserStatus.valueOf(status);
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(
                    "Invalid status. Allowed values: ACTIVE, INACTIVE, BANNED. Got: " + status);
        }
    }

    // ─── Mock builders ───────────────────────────────────────────────────────

    private GeneratedQuestionResponse buildQuestion(String part, String difficulty, int index) {
        return switch (part) {
            case "PART_5" -> buildPart5Question(difficulty, index);
            case "PART_6" -> buildPart6Question(difficulty, index);
            default       -> buildPart7Question(difficulty, index);
        };
    }

    private GeneratedQuestionResponse buildPart5Question(String difficulty, int index) {
        String content = String.format(PART5_PASSAGE_TEMPLATE, difficulty) +
                " [Q" + index + "]";
        return GeneratedQuestionResponse.builder()
                .content(content)
                .passage(null)
                .correctAnswer("B")
                .options(buildOptions(
                        "releases", "released", "has released", "releasing"))
                .build();
    }

    private GeneratedQuestionResponse buildPart6Question(String difficulty, int index) {
        String content = "Choose the best word to complete blank #" + index + " in the memo.";
        String answer  = (index % 2 == 0) ? "A" : "C";
        return GeneratedQuestionResponse.builder()
                .content(content)
                .passage(PART6_PASSAGE)
                .correctAnswer(answer)
                .options(buildOptions(
                        "closed", "opening", "open", "closure"))
                .build();
    }

    private GeneratedQuestionResponse buildPart7Question(String difficulty, int index) {
        String content = "Question " + index + ": What position is Sunrise Tech advertising for?";
        return GeneratedQuestionResponse.builder()
                .content(content)
                .passage(PART7_PASSAGE)
                .correctAnswer("A")
                .options(buildOptions(
                        "Software Engineer",
                        "Data Analyst",
                        "Project Manager",
                        "HR Specialist"))
                .build();
    }

    private List<OptionDto> buildOptions(String a, String b, String c, String d) {
        return List.of(
                OptionDto.builder().label("A").content(a).build(),
                OptionDto.builder().label("B").content(b).build(),
                OptionDto.builder().label("C").content(c).build(),
                OptionDto.builder().label("D").content(d).build()
        );
    }

    // ─── Utility ─────────────────────────────────────────────────────────────

    private String removeDiacritics(String text) {
        String normalized = java.text.Normalizer.normalize(text, java.text.Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                         .replace("đ", "d")
                         .replace("Đ", "D");
    }
}
