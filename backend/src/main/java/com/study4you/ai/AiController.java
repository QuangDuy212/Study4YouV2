package com.study4you.ai;

import com.study4you.ai.dto.GenerateQuestionRequest;
import com.study4you.ai.dto.GenerateUserRequest;
import com.study4you.ai.dto.GeneratedQuestionResponse;
import com.study4you.ai.dto.GeneratedUserResponse;
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
                        request.getCount()
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
