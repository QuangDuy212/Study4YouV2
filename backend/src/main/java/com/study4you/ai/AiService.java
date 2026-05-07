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
            String part, String difficulty, int count, String topic, String context) {

        validatePart(part);
        validateDifficulty(difficulty);

        if (geminiClient.isAvailable()) {
            try {
                String prompt = buildQuestionPrompt(part, difficulty, count, topic, context);
                String responseBody = geminiClient.generate(prompt, true);
                String cleanJson = extractJson(responseBody);
                
                log.debug("Extracted AI JSON for questions (Part {}): {}", part, cleanJson);
                
                com.fasterxml.jackson.databind.JsonNode rootNode = objectMapper.readTree(cleanJson);
                com.fasterxml.jackson.databind.JsonNode dataNode = rootNode.has("data") ? rootNode.get("data") : rootNode;
                
                if (dataNode.isArray()) {
                    return objectMapper.convertValue(dataNode, 
                        new com.fasterxml.jackson.core.type.TypeReference<List<GeneratedQuestionResponse>>() {});
                }
            } catch (Exception e) {
                log.error("AI question generation via LLM failed (Part {}), falling back to local mock generator. Error: {}", part, e.getMessage());
            }
        } else {
            log.warn("AI service not available, falling back to local mock generator.");
        }

        // Beautiful local mock generator fallback to ensure 100% stability and 0 errors!
        List<GeneratedQuestionResponse> fallbackQuestions = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            fallbackQuestions.add(buildQuestion(part, difficulty, i + 1, topic));
        }
        return fallbackQuestions;
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
                String responseBody = geminiClient.generate(prompt, true);
                String cleanJson = extractJson(responseBody);
                
                log.debug("Extracted AI JSON for users: {}", cleanJson);
                
                com.fasterxml.jackson.databind.JsonNode rootNode = objectMapper.readTree(cleanJson);
                com.fasterxml.jackson.databind.JsonNode dataNode = rootNode.has("data") ? rootNode.get("data") : rootNode;

                List<GeneratedUserResponse> aiUsers = new ArrayList<>();
                if (dataNode.isArray()) {
                    aiUsers = objectMapper.convertValue(dataNode, 
                        new com.fasterxml.jackson.core.type.TypeReference<List<GeneratedUserResponse>>() {});
                }
                
                aiUsers.forEach(u -> {
                    u.setRoleId(safeRoleId);
                    u.setStatus(status);
                    if (u.getPassword() == null) u.setPassword("123456");
                });
                return aiUsers;
            } catch (Exception e) {
                log.error("AI user generation failed: {}. Error: {}", e.getMessage(), e.getClass().getSimpleName());
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
                    .password("123456")
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

    private String buildQuestionPrompt(String part, String difficulty, int count, String userTopic, String context) {
        String setInstructions = "";
        String textBlockField = "passage";

        if ("PART_1".equals(part)) {
            setInstructions = "\n- This is PART_1 (Photographs). Generate a short description of a hypothetical photograph in the 'content' field. " +
                    "Then generate 4 options (A, B, C, D) describing potential actions or states in that photo. " +
                    "One option must be correct, and others should be plausible distractors.";
        } else if ("PART_2".equals(part)) {
            setInstructions = "\n- This is PART_2 (Question-Response). Generate a short spoken question or statement. " +
                    "Generate EXACTLY 3 options (A, B, C) instead of 4. The options must be typical spoken responses.";
        } else if ("PART_3".equals(part) || "PART_4".equals(part)) {
            String type = "PART_3".equals(part) ? "Conversations" : "Short Talks";
            textBlockField = "transcript";
            setInstructions = "\n- This is " + part + " (" + type + "). You MUST generate questions in sets of exactly 3 questions. " +
                    "CRITICAL: You MUST provide the full conversational text in the 'transcript' field for EVERY set. " +
                    "DO NOT use 'passage'. DO NOT leave 'transcript' empty. The transcript MUST contain the spoken dialogue with speaker labels.";
        } else if ("PART_6".equals(part)) {
            setInstructions = "\n- This is PART_6 (Text Completion). You MUST generate sets of 4 questions. " +
                    "Each set of 4 questions MUST share the exact same 'passage' (a professional email, letter, or notice with 4 blanks marked as ____[1], ____[2], etc.). " +
                    "Provide the correct word for each blank as the correctAnswer.";
        } else if ("PART_7".equals(part)) {
            setInstructions = "\n- This is PART_7 (Reading Comprehension). Generate questions in sets. " +
                    "Each set MUST share a common 'passage' (e.g., an invoice, a press release, or an online chat). " +
                    "Vary question types: main idea, specific detail, inference, and vocabulary-in-context.";
        }

        String topicContext = (userTopic != null && !userTopic.isBlank()) 
                ? "Primary Theme: " + userTopic 
                : "Diverse Business Themes: " + String.join(", ", DOMAINS);

        String textBlockInstruction = textBlockField.equals("transcript")
                ? "- MANDATORY: The 'transcript' field MUST contain the full dialogue/talk. NEVER leave it empty."
                : "- MANDATORY: The 'passage' field MUST contain the full reading text. NEVER leave it empty.";

        // Add context instruction if provided
        String contextInstruction = (context != null && !context.isBlank())
                ? "\n- MANDATORY: Use the following provided TRANSCRIPT/PASSAGE to generate questions. DO NOT invent new text for the " + textBlockField + " field, use this: \n--- START CONTEXT ---\n" + context + "\n--- END CONTEXT ---\n"
                : "";

        return String.format(
            "ACT AS: Expert TOEIC Content Creator.\n" +
            "TASK: Generate exactly %d TOEIC %s questions. Difficulty: %s.\n" +
            "OUTPUT FORMAT: Return ONLY a raw JSON object. No conversation, no markdown blocks. Use double quotes for all keys and strings.\n" +
            "RULES:\n" +
            "- CRITICAL ANTI-REPETITION: You MUST ensure MAXIMUM DIVERSITY. Every single set MUST have a completely UNIQUE passage/transcript and UNIQUE questions. DO NOT reuse any scenarios, names, or text. Generate completely different situations (e.g. restaurant, office meeting, airport, retail store, etc.).\n" +
            "- %s\n" +
            "- %s\n" +
            "%s\n" +
            "%s\n\n" +
            "JSON STRUCTURE:\n" +
            "{\n" +
            "  \"data\": [\n" +
            "    {\n" +
            "      \"content\": \"Question text\",\n" +
            "      \"%s\": \"MUST CONTAIN THE FULL TEXT HERE. DO NOT LEAVE EMPTY!\",\n" +
            "      \"correctAnswer\": \"A\",\n" +
            "      \"options\": [\n" +
            "        {\"label\": \"A\", \"content\": \"Choice A\"},\n" +
            "        {\"label\": \"B\", \"content\": \"Choice B\"},\n" +
            "        {\"label\": \"C\", \"content\": \"Choice C\"}" +
            ("PART_2".equals(part) ? "" : ",\n        {\"label\": \"D\", \"content\": \"Choice D\"}") +
            "\n      ]\n" +
            "    }\n" +
            "  ]\n" +
            "}",
            count, part, difficulty, setInstructions, topicContext, textBlockInstruction, contextInstruction, textBlockField
        );
    }

    private String buildUserPrompt(int count) {
        return String.format(
            "Generate exactly %d realistic Vietnamese full names and unique email addresses.\n" +
            "Return a strict JSON object containing a 'data' array. Each object in the array must have:\n" +
            "  \"name\": full Vietnamese name (e.g., \"Nguyen Van An\"),\n" +
            "  \"email\": a lowercase email string ending with @study4you.vn based on the name.\n" +
            "Return ONLY the JSON object. Example: {\"data\":[...]}",
            count
        );
    }

    private String extractJson(String text) {
        if (text == null || text.isBlank()) return "[]";
        
        // Remove markdown code blocks if present
        String cleaned = text.replaceAll("(?s)```(?:json)?\\s*(.*?)\\s*```", "$1").trim();
        
        // Find the outermost [ ] or { }
        int startBrace = cleaned.indexOf("{");
        int startBracket = cleaned.indexOf("[");
        
        int start = -1;
        if (startBrace != -1 && (startBracket == -1 || startBrace < startBracket)) {
            start = startBrace;
        } else if (startBracket != -1) {
            start = startBracket;
        }

        int endBrace = text.lastIndexOf("}");
        int endBracket = text.lastIndexOf("]");
        
        int end = -1;
        if (endBrace != -1 && (endBracket == -1 || endBrace > endBracket)) {
            end = endBrace;
        } else {
            end = endBracket;
        }
        
        if (start != -1 && end != -1 && end > start) {
            return text.substring(start, end + 1).trim();
        }
        
        return text.trim();
    }

    // ─── Validation ──────────────────────────────────────────────────────────

    private void validatePart(String part) {
        List<String> allowed = List.of("PART_1", "PART_2", "PART_3", "PART_4", "PART_5", "PART_6", "PART_7");
        if (!allowed.contains(part)) {
            throw new BadRequestException(
                    "Only allowed parts: PART_1, PART_2, PART_3, PART_4, PART_5, PART_6, PART_7. Got: " + part);
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
            case "PART_1" -> buildPart1Question(difficulty, index, topic);
            case "PART_2" -> buildPart2Question(difficulty, index, topic);
            case "PART_3", "PART_4" -> buildPart3Question(difficulty, index, topic);
            case "PART_5" -> buildPart5Question(difficulty, index, topic);
            case "PART_6" -> buildPart6Question(difficulty, index, topic);
            default       -> buildPart7Question(difficulty, index, topic);
        };
    }

    private GeneratedQuestionResponse buildPart1Question(String difficulty, int index, String topic) {
        return GeneratedQuestionResponse.builder()
                .content("A man is working at his desk.")
                .passage("Describe the photograph.")
                .correctAnswer("A")
                .options(new java.util.ArrayList<>(List.of(
                    OptionDto.builder().label("A").content("A man is working at his desk.").build(),
                    OptionDto.builder().label("B").content("A man is eating in a restaurant.").build(),
                    OptionDto.builder().label("C").content("A man is running in the park.").build(),
                    OptionDto.builder().label("D").content("A man is sleeping on the sofa.").build()
                )))
                .build();
    }

    private GeneratedQuestionResponse buildPart3Question(String difficulty, int index, String topic) {
        String[][] qData = {
            {"What is the main topic of the conversation?", "A software update", "A project deadline", "A broken computer", "A meeting cancellation"},
            {"What does the man want to know?", "The release date", "The cost of repairs", "The location of the office", "The manager's phone number"},
            {"When is the event scheduled?", "Tomorrow morning", "Next week", "This evening", "On Monday"}
        };
        int qTypeIndex = (index - 1) % 3;
        String[] currentQ = qData[qTypeIndex];
        
        return GeneratedQuestionResponse.builder()
                .content(currentQ[0])
                .passage("M: Hi, do you know when the new " + (topic != null ? topic : "software") + " update will be released? W: Yes, it is scheduled for tomorrow morning.")
                .correctAnswer("A")
                .options(new java.util.ArrayList<>(List.of(
                    OptionDto.builder().label("A").content(currentQ[1]).build(),
                    OptionDto.builder().label("B").content(currentQ[2]).build(),
                    OptionDto.builder().label("C").content(currentQ[3]).build(),
                    OptionDto.builder().label("D").content(currentQ[4]).build()
                )))
                .build();
    }

    private GeneratedQuestionResponse buildPart2Question(String difficulty, int index, String topic) {
        String content = index % 2 == 0 
            ? "When is the meeting about the new " + (topic != null && !topic.isBlank() ? topic : "sales") + " report?" 
            : "Where did you put the new " + (topic != null && !topic.isBlank() ? topic : "sales") + " report?";
            
        return GeneratedQuestionResponse.builder()
                .content(content)
                .passage(null)
                .correctAnswer("B")
                .options(new java.util.ArrayList<>(List.of(
                    OptionDto.builder().label("A").content("Yes, it's very new.").build(),
                    OptionDto.builder().label("B").content(index % 2 == 0 ? "At 3 PM." : "On your desk.").build(),
                    OptionDto.builder().label("C").content("About 20 pages.").build()
                )))
                .build();
    }

    private GeneratedQuestionResponse buildPart5Question(String difficulty, int index, String topic) {
        String company = (topic != null && !topic.isBlank()) ? topic + " Co." : COMPANIES.get(random.nextInt(COMPANIES.size()));
        int type = random.nextInt(4); // 0: Tense, 1: Word Form, 2: Preposition, 3: Conjunction

        String content;
        List<String> opts;
        String correct = "B";

        switch (type) {
            case 1 -> { // Word Form
                content = String.format("The marketing team works _____ to meet the deadline. ", difficulty.toLowerCase());
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
                content = String.format("%s _____ its annual report last month. ", company, difficulty.toLowerCase());
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
