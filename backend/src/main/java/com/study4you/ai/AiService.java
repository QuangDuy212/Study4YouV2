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

    // ─── Mock question pools for extreme variety ─────────────────────────────
    private static final List<String> COMPANIES = List.of(
            "Global Solutions", "Apex Tech", "Visionary Corp", "EcoStream", "Swift Logistics", 
            "Horizon Bank", "Nova Marketing", "Solaris Energy", "Titan Logistics", "Lumina Health",
            "Azure Soft", "Emerald Group", "Peak Finance", "Silver Lining Travel", "Zenith Retail"
    );
    private static final List<String> DEPTS = List.of(
            "Accounting", "Human Resources", "Marketing", "Engineering", "Sales", "Customer Support",
            "Legal", "Procurement", "Information Technology", "Public Relations", "R&D", "Logistics"
    );
    private static final List<String> POSITIONS = List.of(
            "Software Developer", "Data Analyst", "Project Manager", "Office Assistant", "Account Executive",
            "UX Designer", "Network Engineer", "Systems Architect", "Operations Manager", "Publicist"
    );
    private static final List<String> AD_SCENARIOS = List.of(
            "looking for a motivated %s to join our growing team.",
            "is hiring a full-time %s with at least 3 years experience.",
            "seeks a talented %s for our new office location.",
            "has an opening for a %s starting immediately.",
            "is expanding and requires a skilled %s.",
            "invites applications for the position of %s."
    );
    private static final List<String> MEMO_TOPICS = List.of(
            "maintenance", "renovation", "inspections", "cleaning", "upgrades",
            "security protocols", "software migration", "policy changes", "parking updates", "energy saving"
    );
    private static final List<String> DOMAINS = List.of(
            "High-frequency trading", "Sustainable agriculture", "Medical device manufacturing", 
            "Boutique hotel management", "E-commerce logistics", "Aerospace engineering",
            "International law firm", "Renewable energy startup", "Fashion retail", "Cloud computing"
    );

    // --- Answer Option Pools ---
    private static final List<List<String>> PART5_GRAMMAR_SETS = List.of(
            List.of("completes", "completed", "has completed", "completing"),
            List.of("submits", "submitted", "is submitting", "submission"),
            List.of("negotiates", "negotiated", "negotiation", "negotiable"),
            List.of("strongly", "strength", "strengthen", "strong"),
            List.of("efficiently", "efficiency", "efficient", "efficacious"),
            List.of("accepts", "accepted", "acceptable", "acceptance"),
            List.of("develops", "developed", "developing", "development")
    );

    private static final List<List<String>> ACTION_OPTIONS = List.of(
            List.of("Review the contract", "Call the manager", "Send an email", "Attend a workshop"),
            List.of("Submit the report", "Order supplies", "Schedule a meeting", "Visit the warehouse"),
            List.of("Analyze the data", "Update the website", "Fix the server", "Train the new staff"),
            List.of("Launch a campaign", "Hire a consultant", "Lower the prices", "Open a new branch")
    );

    private final Random random = new Random();

    // ─────────────────────────────────────────────────────────────────────────

    public List<GeneratedQuestionResponse> generateReadingQuestions(
            String part, String difficulty, int count, String topic) {

        validatePart(part);
        validateDifficulty(difficulty);

        if (geminiClient.isAvailable()) {
            try {
                String prompt = buildQuestionPrompt(part, difficulty, count, topic);
                String response = geminiClient.generate(prompt);
                String json = extractJson(response);
                return objectMapper.readValue(json, new com.fasterxml.jackson.core.type.TypeReference<List<GeneratedQuestionResponse>>() {});
            } catch (Exception e) {
                log.error("Gemini question generation failed, falling back to mock: {}", e.getMessage());
            }
        }

        List<GeneratedQuestionResponse> result = new ArrayList<>();
        for (int i = 1; i <= count; i++) {
            result.add(buildQuestion(part, difficulty, i, topic));
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

    private String buildQuestionPrompt(String part, String difficulty, int count, String userTopic) {
        String setInstructions = "";
        if ("PART_6".equals(part)) {
            setInstructions = "\n- This is PART_6 (Text Completion). Questions MUST be generated in sets of 4. " +
                    "Each set of 4 questions MUST share the exact same 'passage' (a text with 4 numbered blanks). " +
                    "Each question's 'content' should be like 'Choose the best word for blank #[number]'.";
        } else if ("PART_7".equals(part)) {
            setInstructions = "\n- This is PART_7 (Reading Comprehension). Questions MUST be generated in sets of 2 or more. " +
                    "Each set MUST share the exact same 'passage' (an article, email, or ad). " +
                    "Questions in the same set must have the same 'passage' string.";
        }

        String topicContext = (userTopic != null && !userTopic.isBlank()) 
                ? "Topic Hint: " + userTopic 
                : "Diverse Domains: " + String.join(", ", DOMAINS);

        UUID generationSeed = UUID.randomUUID();
        return String.format(
            "Generation Seed: %s\n" +
            "You are a professional TOEIC test designer. Generate exactly %d TOEIC %s questions " +
            "at %s difficulty level in a strict JSON array format.%s\n" +
            "AUTHENTIC TOEIC VARIETY GUIDELINES:\n" +
            "- %s\n" +
            "- CATEGORIES TO COVER: Rotate through the following types:\n" +
            "  1. GRAMMAR: Verb tenses, word forms (adj/adv/noun/verb), pronouns, comparison.\n" +
            "  2. VOCABULARY: Business meaning, precision, collocations.\n" +
            "  3. STRUCTURE: Prepositions, conjunctions (because of vs although), relative clauses.\n" +
            "  4. LOGIC (Part 6/7): Inference, purpose of the text, specific details, synonym matching.\n" +
            "- ABSOLUTELY NO REPETITION of company names or scenarios.\n" +
            "- Ensure distractors (options) are professionally crafted (e.g., different parts of speech of the same root).\n" +
            "- Each set MUST feel unique and professional.\n" +
            "Format Requirement:\n" +
            "Return a JSON array where each object has:\n" +
            "  \"content\": string (the question stem),\n" +
            "  \"passage\": string or null (shared text for PART_6/7),\n" +
            "  \"correctAnswer\": exactly one of \"A\", \"B\", \"C\", \"D\",\n" +
            "  \"options\": an array of 4 objects, each with \"label\" (\"A\"-\"D\") and \"content\".\n" +
            "Return ONLY the JSON. No markdown backticks. No explanation.",
            generationSeed, count, part, difficulty, setInstructions, topicContext
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

    private GeneratedQuestionResponse buildQuestion(String part, String difficulty, int index, String topic) {
        return switch (part) {
            case "PART_5" -> buildPart5Question(difficulty, index, topic);
            case "PART_6" -> buildPart6Question(difficulty, index, topic);
            default       -> buildPart7Question(difficulty, index, topic);
        };
    }

    private GeneratedQuestionResponse buildPart5Question(String difficulty, int index, String topic) {
        String company = (topic != null && !topic.isBlank()) ? topic + " Co." : COMPANIES.get(random.nextInt(COMPANIES.size()));
        int type = random.nextInt(4); // 0: Tense, 1: Word Form, 2: Preposition, 3: Conjunction

        String content;
        List<String> opts;
        String correct = "B";

        switch (type) {
            case 1 -> { // Word Form
                content = String.format("The marketing team works _____ to meet the deadline. (%s level)", difficulty.toLowerCase());
                opts = List.of("diligent", "diligently", "diligence", "diligentness");
            }
            case 2 -> { // Preposition
                content = String.format("The board meeting will take place _____ the conference room at 2 PM.", company);
                opts = List.of("at", "in", "on", "between");
            }
            case 3 -> { // Conjunction
                content = String.format("_____ the heavy rain, the outdoor ceremony continued as planned.", company);
                opts = List.of("Because", "Despite", "Although", "But");
                correct = "B";
            }
            default -> { // Tense
                content = String.format("%s _____ its annual report last month. (%s level) [Q%d]", company, difficulty.toLowerCase(), index);
                opts = PART5_GRAMMAR_SETS.get(random.nextInt(PART5_GRAMMAR_SETS.size()));
            }
        }
        
        return GeneratedQuestionResponse.builder()
                .content(content)
                .passage(null)
                .correctAnswer(correct)
                .options(buildOptions(opts.get(0), opts.get(1), opts.get(2), opts.get(3)))
                .build();
    }

    private GeneratedQuestionResponse buildPart6Question(String difficulty, int index, String userTopic) {
        int setNum = (index - 1) / 4;
        String topic = (userTopic != null && !userTopic.isBlank()) ? userTopic : MEMO_TOPICS.get(setNum % MEMO_TOPICS.size());
        String dept = DEPTS.get(setNum % DEPTS.size());
        
        String passage = String.format(
            "Memo\n\nTo: All Staff\nFrom: %s Department\n\n" +
            "Please be advised that the office will be _____ on Friday due to scheduled %s. " +
            "All employees are expected to work remotely and remain _____ during regular business hours.",
            dept, topic
        );

        String content = "Choose the best word to complete blank #" + ((index - 1) % 4 + 1) + " in the memo.";
        String answer  = (index % 2 == 0) ? "A" : "C";
        
        // Randomize Part 6 options for variety
        List<String> p6Options = List.of("closed", "available", "monitored", "restricted", "upgraded", "renovated");
        Collections.shuffle(new ArrayList<>(p6Options));

        return GeneratedQuestionResponse.builder()
                .content(content)
                .passage(passage)
                .correctAnswer(answer)
                .options(buildOptions(
                        p6Options.get(0), p6Options.get(1), p6Options.get(2), p6Options.get(3)))
                .build();
    }

    private GeneratedQuestionResponse buildPart7Question(String difficulty, int index, String userTopic) {
        int setNum = (index - 1) / 2;
        String company = (userTopic != null && !userTopic.isBlank()) ? userTopic + " Ltd." : COMPANIES.get(setNum % COMPANIES.size());
        String position = POSITIONS.get(setNum % POSITIONS.size());
        String scenario = String.format(AD_SCENARIOS.get(setNum % AD_SCENARIOS.size()), position);

        String passage = String.format(
            "Advertisement\n\n%s %s " +
            "The ideal candidate will have at least three years of experience. " +
            "We offer a competitive package and flexible hours. " +
            "Interested applicants should email their resumes to hr@%s.com.",
            company, scenario, company.toLowerCase().replace(" ", "")
        );

        String content;
        String correct = "A";
        List<String> opts;

        if (index % 2 == 1) {
            content = "What is the primary purpose of this advertisement?";
            correct = "A";
            opts = List.of("To recruit new staff", "To announce a sale", "To promote a new product", "To invite customers to an event");
        } else {
            content = "Which of the following is NOT described as a requirement?";
            correct = "C";
            List<String> actions = new ArrayList<>(ACTION_OPTIONS.get(random.nextInt(ACTION_OPTIONS.size())));
            Collections.shuffle(actions);
            opts = List.of("At least three years experience", "Professional certification", actions.get(0), "Ability to work flexible hours");
        }

        return GeneratedQuestionResponse.builder()
                .content(content)
                .passage(passage)
                .correctAnswer(correct)
                .options(buildOptions(opts.get(0), opts.get(1), opts.get(2), opts.get(3)))
                .build();
    }

    private List<OptionDto> buildOptions(String a, String b, String c, String d) {
        List<String> contents = new java.util.ArrayList<>(List.of(a, b, c, d));
        Collections.shuffle(contents);
        
        List<OptionDto> options = new ArrayList<>();
        String[] labels = {"A", "B", "C", "D"};
        for (int i = 0; i < 4; i++) {
            options.add(OptionDto.builder().label(labels[i]).content(contents.get(i)).build());
        }
        return options;
    }

    // ─── Utility ─────────────────────────────────────────────────────────────

    private String removeDiacritics(String text) {
        String normalized = java.text.Normalizer.normalize(text, java.text.Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                         .replace("đ", "d")
                         .replace("Đ", "D");
    }
}
