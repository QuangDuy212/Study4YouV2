package com.study4you.ai.service;

import com.study4you.ai.GeminiClient;
import com.study4you.ai.dto.ChatResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiTutorService {

    private final GeminiClient geminiClient;

    public ChatResponse ask(String question) {
        if (!geminiClient.isAvailable()) {
            return ChatResponse.builder().reply("AI chưa được cấu hình.").build();
        }

        try {
            // Chỉ gửi trực tiếp tới Gemini, không RAG, không fallback lằng nhằng
            String prompt = "You are Study4You AI, a friendly and knowledgeable TOEIC tutor assistant.\n\nUser: " + question + "\n\nAssistant:";
            String reply = geminiClient.generate(prompt);
            return ChatResponse.builder().reply(reply).build();

        } catch (Exception e) {
            log.error("AI Tutor chat failed: {}", e.getMessage());
            return ChatResponse.builder().reply("Lỗi từ Gemini: " + e.getMessage()).build();
        }
    }
}