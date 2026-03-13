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

        // 1. Try vector search if embeddings are available
        final List<Double> queryVector = getQueryVector(question);

        if (!queryVector.isEmpty()) {
            return index.stream()
                    .filter(doc -> doc.getEmbedding() != null && !doc.getEmbedding().isEmpty())
                    .map(doc -> new java.util.AbstractMap.SimpleEntry<>(doc, cosineSimilarity(queryVector, doc.getEmbedding())))
                    .sorted((e1, e2) -> Double.compare(e2.getValue(), e1.getValue()))
                    .limit(topK)
                    .map(java.util.AbstractMap.SimpleEntry::getKey)
                    .collect(Collectors.toList());
        }

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
        double score = 0;
        if (doc.getTitle() != null && doc.getTitle().toLowerCase().contains(query)) score += 10;
        if (doc.getContent().toLowerCase().contains(query)) score += 5;
        // Boost project-specific docs over generic ones
        if (doc.getType().equals("QUESTION")) score += 2;
        if (doc.getTitle() != null && (doc.getTitle().contains("TOEIC") || doc.getTitle().contains("FAQ"))) score += 3;
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
