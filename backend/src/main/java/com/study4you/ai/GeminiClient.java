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

    @Value("${gemini.model:gemini-2.0-flash}")
    private String model;

    private Client client;

    @PostConstruct
    public void init() {
        if (apiKey != null && !apiKey.isBlank()) {
            // The SDK reads GOOGLE_API_KEY by default; we pass it explicitly via builder.
            client = Client.builder()
                    .apiKey(apiKey)
                    .build();
            log.info("GeminiClient initialised — model: {}", model);
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

        GenerateContentConfig config = GenerateContentConfig.builder()
                .candidateCount(1)
                .maxOutputTokens(4096)
                .build();

        GenerateContentResponse response = client.models.generateContent(model, prompt, config);
        return response.text();
    }
}
