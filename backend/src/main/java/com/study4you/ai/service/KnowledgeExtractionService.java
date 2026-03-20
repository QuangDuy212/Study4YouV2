package com.study4you.ai.service;

import com.study4you.ai.dto.KnowledgeDocument;
import com.study4you.toeic.question.repository.ToeicQuestionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Service;
import org.springframework.util.StreamUtils;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class KnowledgeExtractionService {

    private final ToeicQuestionRepository questionRepository;
    private final ResourceLoader resourceLoader;

    public List<KnowledgeDocument> extractAll() {
        List<KnowledgeDocument> docs = new ArrayList<>();

        // 1. Load documentation
        String rootDir = System.getProperty("user.dir");
        docs.addAll(extractDocumentation("file:" + rootDir + "/README.md", "README"));
        docs.addAll(extractDocumentation("file:" + rootDir + "/QUICK_START.md", "Quick Start"));
        docs.addAll(extractDocumentation("file:" + rootDir + "/API_EXAMPLES.md", "API Examples"));
        
        // Custom resources
        docs.addAll(extractDocumentation("classpath:toeic-guides.md", "TOEIC Guides"));
        docs.addAll(extractDocumentation("classpath:platform-faq.md", "Platform FAQ"));

        // 2. Load questions with explanations
        docs.addAll(extractQuestions());

        return docs;
    }

    private List<KnowledgeDocument> extractDocumentation(String path, String name) {
        try {
            Resource resource = resourceLoader.getResource(path);
            if (!resource.exists()) return List.of();
            
            String content = StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
            
            // Better chunking by headers
            String[] sections = content.split("(?=^#+ )");
            List<KnowledgeDocument> docs = new ArrayList<>();
            for (int i = 0; i < sections.length; i++) {
                String section = sections[i].trim();
                if (section.isEmpty()) continue;

                // If a section is too large, split it further by paragraphs
                if (section.length() > 1500) {
                    String[] paragraphs = section.split("\n\n");
                    StringBuilder sb = new StringBuilder();
                    int subIdx = 0;
                    for (String p : paragraphs) {
                        if (sb.length() + p.length() > 1000) {
                            docs.add(createDoc(name + "_" + i + "_" + subIdx++, name, sb.toString()));
                            sb.setLength(0);
                        }
                        sb.append(p).append("\n\n");
                    }
                    if (sb.length() > 0) {
                        docs.add(createDoc(name + "_" + i + "_" + subIdx, name, sb.toString()));
                    }
                } else {
                    docs.add(createDoc(name + "_" + i, name, section));
                }
            }
            return docs;
        } catch (IOException e) {
            log.error("Failed to load doc {}: {}", path, e.getMessage());
            return List.of();
        }
    }

    private KnowledgeDocument createDoc(String id, String title, String content) {
        return KnowledgeDocument.builder()
                .id(id)
                .type("DOC")
                .title(title)
                .content(content.trim())
                .build();
    }

    private List<KnowledgeDocument> extractQuestions() {
        return questionRepository.findAll().stream()
                .filter(q -> q.getExplanation() != null && !q.getExplanation().isBlank())
                .map(q -> KnowledgeDocument.builder()
                        .id("Q_" + q.getId())
                        .type("QUESTION")
                        .title("TOEIC Part " + (q.getPartId() != null ? "Help" : ""))
                        .content("Question: " + q.getContent() + "\nExplanation: " + q.getExplanation())
                        .build())
                .collect(Collectors.toList());
    }
}
