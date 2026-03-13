package com.study4you.ai.service;

import com.study4you.ai.GeminiClient;
import com.study4you.ai.dto.ChatResponse;
import com.study4you.ai.dto.KnowledgeDocument;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiTutorService {

    private final GeminiClient geminiClient;
    private final VectorStoreService vectorStoreService;

    public ChatResponse ask(String question) {
        if (!geminiClient.isAvailable()) {
            return ChatResponse.builder()
                    .reply("Gemini API is not configured. Please check your API key.")
                    .build();
        }

        try {
            // 1. Retrieve relevant context (RAG)
            List<KnowledgeDocument> contextDocs = vectorStoreService.search(question, 5);
            
            String contextText = contextDocs.stream()
                    .map(doc -> "[" + doc.getType() + " - " + (doc.getTitle() != null ? doc.getTitle() : "Info") + "]: " + doc.getContent())
                    .collect(Collectors.joining("\n\n"));

            // 2. Construct prompt
            String systemMessage = "You are the Study4You AI Tutor. Use the following context to help the user.\n\n" +
                    "Context:\n" + contextText + "\n\n";

            String prompt = systemMessage + "User Question: " + question;

            // 3. Generate response from ACTUAL Gemini
            String reply = geminiClient.generate(prompt);
            
            return ChatResponse.builder().reply(reply).build();
        } catch (com.study4you.ai.exception.AiQuotaException e) {
            log.warn("Gemini Quota hit: {}", e.getMessage());
            return ChatResponse.builder()
                    .reply("Gemini API đang hết lượt truy cập miễn phí (429). Vui lòng thử lại sau vài giây hoặc nâng cấp gói API!")
                    .build();
        } catch (Exception e) {
            log.error("AI Tutor chat failed: {}", e.getMessage());
            return ChatResponse.builder()
                    .reply("Lỗi kết nối Gemini: " + e.getMessage())
                    .build();
        }
    }
}
