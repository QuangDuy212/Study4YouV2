package com.study4you.ai.service;

import com.study4you.ai.GeminiClient;
import com.study4you.ai.dto.KnowledgeDocument;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VectorStoreService {

    private final GeminiClient geminiClient;
    private final List<KnowledgeDocument> index = new ArrayList<>();

    public void addDocument(KnowledgeDocument doc) {
        index.add(doc);
    }

    public void addDocuments(List<KnowledgeDocument> docs) {
        index.addAll(docs);
    }

    public void clear() {
        index.clear();
    }

    public List<KnowledgeDocument> search(String question, int topK) {
        if (index.isEmpty()) {
            return List.of();
        }

        // --- DISABLE VECTOR SEARCH TO SAVE QUOTA ---
        // Chúng ta tạm thời dùng Keyword search thuần túy để dành toàn bộ quota cho việc Chat.
        // ---
        
        // 2. Fallback to keyword search (resilient)
        String query = question.toLowerCase();
        if (query.length() < 3) return List.of();
        
        return index.stream()
                .filter(doc -> doc.getContent().toLowerCase().contains(query) || 
                               (doc.getTitle() != null && doc.getTitle().toLowerCase().contains(query)))
                .map(doc -> new java.util.AbstractMap.SimpleEntry<>(doc, calculateBasicScore(doc, query)))
                .sorted((e1, e2) -> Double.compare(e2.getValue(), e1.getValue()))
                .limit(topK)
                .map(java.util.AbstractMap.SimpleEntry::getKey)
                .collect(Collectors.toList());
    }

    private List<Double> getQueryVector(String question) {
        try {
            if (geminiClient.isAvailable()) {
                return geminiClient.embed(question);
            }
        } catch (com.study4you.ai.exception.AiQuotaException e) {
            log.warn("Embedding quota reached. Falling back to keyword search for: {}", question);
        } catch (Exception e) {
            log.error("Embedding failed: {}", e.getMessage());
        }
        return List.of();
    }

    private double calculateBasicScore(KnowledgeDocument doc, String query) {
        String content = doc.getContent().toLowerCase();
        String title = doc.getTitle() != null ? doc.getTitle().toLowerCase() : "";
        String[] words = query.split("\\s+");
        
        double score = 0;
        for (String word : words) {
            if (word.length() < 2) continue; // Skip tiny stop-words
            if (title.contains(word)) score += 10;
            if (content.contains(word)) score += 2;
        }

        // Exact phrase match bonus
        if (title.contains(query)) score += 20;
        if (content.contains(query)) score += 10;
        
        // Boost project-specific docs over generic ones
        if ("QUESTION".equals(doc.getType())) score += 5;
        if (title.contains("toeic") || title.contains("faq") || title.contains("study4you")) score += 5;

        return score;
    }

    private double cosineSimilarity(List<Double> v1, List<Double> v2) {
        if (v1 == null || v2 == null || v1.size() != v2.size() || v1.isEmpty()) return 0;
        double dotProduct = 0;
        double normA = 0;
        double normB = 0;
        for (int i = 0; i < v1.size(); i++) {
            dotProduct += v1.get(i) * v2.get(i);
            normA += Math.pow(v1.get(i), 2);
            normB += Math.pow(v2.get(i), 2);
        }
        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}
