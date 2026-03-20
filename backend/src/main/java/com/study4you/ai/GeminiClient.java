package com.study4you.ai;

import com.google.genai.Client;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Thin wrapper around the Google GenAI Java SDK.
 * <p>
 * If {@code gemini.api-key} is blank (default when env var GEMINI_API_KEY is not set),
 * {@link #isAvailable()} returns {@code false} and callers should fall back to mock data.
 */
@Slf4j
@Component
public class GeminiClient {

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-1.5-flash}")
    private String model;

    private Client client;

    @PostConstruct
    public void init() {
        if (apiKey != null && !apiKey.isBlank()) {
            String maskedKey = apiKey.length() > 5 ? apiKey.substring(0, 5) + "..." : "ShortKey";
            log.info("GeminiClient initialised — model: {}, Key: {}, API: v1beta", model, maskedKey);
            // The SDK reads GOOGLE_API_KEY by default; we pass it explicitly via builder.
            client = Client.builder()
                    .apiKey(apiKey)
                    .httpOptions(com.google.genai.types.HttpOptions.builder()
                            .apiVersion("v1beta")
                            .build())
                    .build();
        } else {
            log.warn("GeminiClient: GEMINI_API_KEY is not set. AI endpoints will use mock data.");
        }
    }

    /** Returns true when a valid API key is configured. */
    public boolean isAvailable() {
        return client != null;
    }

    /**
     * Send {@code prompt} to Gemini and return the raw text response.
     *
     * @throws RuntimeException if the Gemini call fails
     */
    public String generate(String prompt) {
        if (!isAvailable()) {
            throw new IllegalStateException("Gemini API key is not configured");
        }

        try {
            GenerateContentConfig config = GenerateContentConfig.builder()
                    .candidateCount(1)
                    .maxOutputTokens(4096)
                    .temperature(1.0f)
                    .build();

            GenerateContentResponse response = client.models.generateContent(model, prompt, config);
            return response.text();
        } catch (Exception e) {
            log.error("Gemini API Error Detail: {}", e.getMessage());
            if (e.getMessage() != null && e.getMessage().contains("429")) {
                throw new com.study4you.ai.exception.AiQuotaException("Gemini API Quota Exceeded: " + e.getMessage());
            }
            throw e;
        }
    }

    /**
     * Generate embeddings for the given text.
     */
    public java.util.List<Double> embed(String text) {
        if (!isAvailable()) {
            throw new IllegalStateException("Gemini API key is not configured");
        }

        try {
            com.google.genai.types.EmbedContentResponse response = client.models.embedContent(
                    "models/gemini-embedding-001", // Verified model name
                    text,
                    com.google.genai.types.EmbedContentConfig.builder().build()
            );

            return response.embeddings()
                    .flatMap(list -> list.stream().findFirst())
                    .flatMap(com.google.genai.types.ContentEmbedding::values)
                    .map(values -> values.stream().map(Float::doubleValue).collect(java.util.stream.Collectors.toList()))
                    .orElse(new java.util.ArrayList<>());
        } catch (Exception e) {
            if (e.getMessage() != null && e.getMessage().contains("429")) {
                throw new com.study4you.ai.exception.AiQuotaException("Gemini API Embedding Quota Exceeded");
            }
            throw e;
        }
    }
}
