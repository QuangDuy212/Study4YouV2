package com.study4you.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Component
public class GeminiClient { // Giữ nguyên tên để file khác khỏi lỗi

    @Value("${ai.api-key:}")
    private String apiKey;

    // Dùng Groq Cloud - Siêu nhanh và miễn phí
    @Value("${ai.model:llama-3.3-70b-versatile}")
    private String model;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private HttpClient httpClient;

    @PostConstruct
    public void init() {
        if (apiKey != null && !apiKey.isBlank()) {
            this.httpClient = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(30)) // Tăng thời gian kết nối
                    .build();
            log.info("Client initialized with stability headers. Model: {}", model);
        }
    }

    public boolean isAvailable() {
        return httpClient != null;
    }

    public String generate(String prompt) {
        return generate(prompt, false);
    }

    public String generate(String prompt, boolean requireJson) {
        if (!isAvailable()) {
            throw new IllegalStateException("OpenRouter API key is missing");
        }

        try {
            // Cổng API của Groq (https://console.groq.com/)
            String url = "https://api.groq.com/openai/v1/chat/completions";

            Map<String, Object> payload = new HashMap<>();
            payload.put("model", model);
            payload.put("temperature", 0.8);
            payload.put("max_tokens", 4096); // Giảm xuống để tránh vượt quá giới hạn TPM của Groq Free Tier
            if (requireJson) {
                payload.put("response_format", Map.of("type", "json_object"));
            }
            
            java.util.List<Map<String, String>> messages = new java.util.ArrayList<>();
            messages.add(Map.of("role", "system", "content", "You are a helpful TOEIC AI tutor for Study4You."));
            messages.add(Map.of("role", "user", "content", prompt));
            payload.put("messages", messages);

            String requestBody = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(60)) // Thời gian chờ phản hồi tối đa 60s
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.error("OpenRouter Error: {}", response.body());
                throw new RuntimeException("HTTP " + response.statusCode() + " từ OpenRouter Server: " + response.body());
            }

            JsonNode root = objectMapper.readTree(response.body());
            
            JsonNode choices = root.path("choices");
            if (choices.isArray() && choices.size() > 0) {
                return choices.get(0).path("message").path("content").asText().trim();
            }

            return "Không lấy được nội dung trả lời từ AI.";

        } catch (Exception e) {
            log.error("AI generate error: {}", e.getMessage());
            throw new RuntimeException(e.getMessage());
        }
    }

    public java.util.List<Double> embed(String text) {
        return new java.util.ArrayList<>(); // Ẩn lỗi do hiện tại chỉ chat
    }
}
