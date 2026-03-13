package com.study4you.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeDocument {
    private String id;
    private String type; // e.g., "DOC", "API", "QUESTION"
    private String title;
    private String content;
    private List<Double> embedding;
    private String metadata; // JSON or simple string
}
