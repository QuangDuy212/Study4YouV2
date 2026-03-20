package com.study4you.ai.service;

import com.study4you.ai.GeminiClient;
import com.study4you.ai.dto.ChatResponse;
import com.study4you.ai.dto.KnowledgeDocument;
import com.study4you.ai.exception.AiQuotaException;
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
        // 1. Kiểm tra cấu hình hệ thống trước
        if (!geminiClient.isAvailable()) {
            return buildResponse("Gemini API is not configured. Please check your API key.");
        }

        try {
            // 2. Lấy dữ liệu liên quan (RAG)
            List<KnowledgeDocument> contextDocs = vectorStoreService.search(question, 5);
            
            // 3. Gọi Gemini để trả lời
            String prompt = buildPrompt(question, contextDocs);
            String reply = geminiClient.generate(prompt);
            
            return buildResponse(reply);

        } catch (AiQuotaException e) {
            log.warn("Gemini Quota hit for question: {}", question);
            return handleQuotaExceeded(question);
        } catch (Exception e) {
            log.error("AI Tutor chat failed: ", e);
            return buildResponse("Lỗi kết nối Gemini: " + e.getMessage());
        }
    }

    // --- Các phương thức hỗ trợ (Private Helpers) giúp code chính sáng sủa hơn ---

    private String buildPrompt(String question, List<KnowledgeDocument> docs) {
        String contextText = docs.stream()
                .map(doc -> String.format("[%s - %s]: %s", 
                    doc.getType(), 
                    doc.getTitle() != null ? doc.getTitle() : "Info", 
                    doc.getContent()))
                .collect(Collectors.joining("\n\n"));

        return "You are the Study4You AI Tutor. Use the following context to help the user.\n\n" +
               "Context:\n" + contextText + "\n\n" +
               "User Question: " + question;
    }

    private ChatResponse handleQuotaExceeded(String question) {
        // Thử lấy kết quả từ Vector Store nếu AI quá tải (Chế độ Cơ bản)
        List<KnowledgeDocument> docs = vectorStoreService.search(question, 1);
        
        if (!docs.isEmpty()) {
            String fallbackReply = "[Chế độ Cơ bản] Hệ thống đang quá tải, đây là thông tin nhanh cho bạn:\n\n" + 
                                   docs.get(0).getContent() + 
                                   "\n\n(Vui lòng thử lại sau giây lát để nhận câu trả lời đầy đủ từ AI).";
            return buildResponse(fallbackReply);
        }

        return buildResponse("Xin lỗi, hệ thống đang bận (429). Bạn thử lại sau ít phút nhé!");
    }

    private ChatResponse buildResponse(String text) {
        return ChatResponse.builder().reply(text).build();
    }
}