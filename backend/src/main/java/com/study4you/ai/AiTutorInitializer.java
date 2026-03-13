package com.study4you.ai;

import com.study4you.ai.dto.KnowledgeDocument;
import com.study4you.ai.service.KnowledgeExtractionService;
import com.study4you.ai.service.VectorStoreService;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class AiTutorInitializer {

    private final KnowledgeExtractionService extractionService;
    private final VectorStoreService vectorStoreService;
    private final GeminiClient geminiClient;

    @org.springframework.beans.factory.annotation.Value("${gemini.init-embeddings:false}")
    private boolean shouldInit;

    @PostConstruct
    public void init() {
        if (!shouldInit) {
            log.info("AI Tutor background initialization is DISABLED via config.");
            return;
        }

        if (!geminiClient.isAvailable()) {
            log.warn("Gemini is not available. AI Tutor will run in keyword-fallback mode.");
        }

        log.info("Starting AI Tutor background initialization...");
        new Thread(() -> {
            try {
                List<KnowledgeDocument> docs = extractionService.extractAll();
                log.info("Extracted {} documents. Starting rate-limited embedding (4s delay)...", docs.size());
                
                int count = 0;
                for (KnowledgeDocument doc : docs) {
                    try {
                        if (geminiClient.isAvailable()) {
                            // Ultra-safe mode: 12s delay (~5 RPM). This ensures we stay 
                            // well below the 15 RPM limit and leave plenty of room for chat.
                            doc.setEmbedding(geminiClient.embed(doc.getContent()));
                            Thread.sleep(12000); 
                            count++;
                        }
                    } catch (com.study4you.ai.exception.AiQuotaException e) {
                        log.warn("Quota reached during init. Waiting 60s cooldown for doc {}.", doc.getId());
                        Thread.sleep(60000); // 1 minute cooldown
                    } catch (Exception e) {
                        log.error("Failed to embed doc {}: {}", doc.getId(), e.getMessage());
                    }
                    vectorStoreService.addDocument(doc);
                }
                log.info("AI Tutor initialization complete. Embedded {}/{} docs.", count, docs.size());
            } catch (Exception e) {
                log.error("AI Tutor critical initialization failure: {}", e.getMessage());
            }
        }).start();
    }
}
