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

    // Dùng mẫu AI miễn phí tốt nhất hiện nay trên OpenRouter (Llama 3 hoặc Qwen)
    @Value("${ai.model:google/gemini-2.0-flash-lite-preview-02-05:free}")
    private String model;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private HttpClient httpClient;

    @PostConstruct
    public void init() {
        if (apiKey != null && !apiKey.isBlank()) {
            this.httpClient = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(15))
                    .build();
            log.info("Client initialized completely direct with OpenRouter Free model: {}", model);
        }
    }

    public boolean isAvailable() {
        return httpClient != null;
    }

    public String generate(String prompt) {
        if (!isAvailable()) {
            throw new IllegalStateException("OpenRouter API key is missing");
        }

        try {
            // Cổng API của OpenRouter (siêu ổn định, miễn phí 100%, không cần thẻ Visa)
            String url = "https://openrouter.ai/api/v1/chat/completions";

            Map<String, Object> payload = new HashMap<>();
            payload.put("model", model);
            
            java.util.List<Map<String, String>> messages = new java.util.ArrayList<>();
            messages.add(Map.of("role", "system", "content", "You are a helpful TOEIC AI tutor for Study4You."));
            messages.add(Map.of("role", "user", "content", prompt));
            payload.put("messages", messages);

            String requestBody = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    // HTTP Site URL và App Name là bắt buộc cho OpenRouter
                    .header("HTTP-Referer", "http://localhost:8080")
                    .header("X-Title", "Study4You")
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
