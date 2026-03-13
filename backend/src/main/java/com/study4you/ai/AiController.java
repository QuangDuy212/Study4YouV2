package com.study4you.ai;

import com.study4you.ai.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;
    private final com.study4you.ai.service.AiTutorService aiTutorService;

    /**
     * POST /api/v1/ai/chat
     * Handles chatbot messages via AI Tutor.
     */
    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@Valid @RequestBody ChatRequest request) {
        return ResponseEntity.ok(aiTutorService.ask(request.getMessage()));
    }

    /**
     * POST /api/v1/ai/generate-questions
     * Generates mock TOEIC Reading questions for PART_5, PART_6, or PART_7.
     */
    @PostMapping("/generate-questions")
    public ResponseEntity<List<GeneratedQuestionResponse>> generateQuestions(
            @Valid @RequestBody GenerateQuestionRequest request) {

        return ResponseEntity.ok(
                aiService.generateReadingQuestions(
                        request.getPart(),
                        request.getDifficulty(),
                        request.getCount(),
                        request.getTopic()
                )
        );
    }

    /**
     * POST /api/v1/ai/generate-users
     * Generates mock Vietnamese-style user previews (no DB write).
     */
    @PostMapping("/generate-users")
    public ResponseEntity<List<GeneratedUserResponse>> generateUsers(
            @Valid @RequestBody GenerateUserRequest request) {

        return ResponseEntity.ok(
                aiService.generateUsers(
                        request.getCount(),
                        request.getDefaultRoleId(),
                        request.getStatus()
                )
        );
    }
}
