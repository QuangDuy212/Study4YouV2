package com.study4you.toeic.question.service;

import com.study4you.common.dto.PageResponse;
import com.study4you.common.exception.ResourceNotFoundException;
import com.study4you.toeic.question.dto.ToeicQuestionRequest;
import com.study4you.toeic.question.dto.ToeicQuestionResponse;
import com.study4you.toeic.question.entity.ToeicQuestion;
import com.study4you.toeic.question.repository.ToeicQuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ToeicQuestionService {

    private final ToeicQuestionRepository toeicQuestionRepository;

    @Transactional(readOnly = true)
    public PageResponse<ToeicQuestionResponse> getAllQuestions(@org.springframework.lang.NonNull Pageable pageable) {
        Page<ToeicQuestion> questionPage = toeicQuestionRepository.findAll(pageable);
        List<ToeicQuestionResponse> questions = questionPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        
        return new PageResponse<>(
                questions,
                questionPage.getNumber(),
                questionPage.getSize(),
                questionPage.getTotalElements(),
                questionPage.getTotalPages(),
                questionPage.isLast()
        );
    }

    @Transactional(readOnly = true)
    public ToeicQuestionResponse getQuestionById(@org.springframework.lang.NonNull UUID id) {
        ToeicQuestion question = toeicQuestionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ToeicQuestion", "id", id));
        return mapToResponse(question);
    }

    @Transactional
    public ToeicQuestionResponse createQuestion(ToeicQuestionRequest request) {
        ToeicQuestion question = new ToeicQuestion();
        question.setPartId(request.getPartId());
        question.setContent(request.getContent());
        question.setAudioUrl(request.getAudioUrl());
        question.setImageUrl(request.getImageUrl());
        question.setPassage(request.getPassage());
        question.setCorrectAnswer(request.getCorrectAnswer());

        ToeicQuestion savedQuestion = toeicQuestionRepository.save(question);
        return mapToResponse(savedQuestion);
    }

    @Transactional
    public ToeicQuestionResponse updateQuestion(@org.springframework.lang.NonNull UUID id, ToeicQuestionRequest request) {
        ToeicQuestion question = toeicQuestionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ToeicQuestion", "id", id));

        question.setPartId(request.getPartId());
        question.setContent(request.getContent());
        question.setAudioUrl(request.getAudioUrl());
        question.setImageUrl(request.getImageUrl());
        question.setPassage(request.getPassage());
        question.setCorrectAnswer(request.getCorrectAnswer());

        ToeicQuestion updatedQuestion = toeicQuestionRepository.save(question);
        return mapToResponse(updatedQuestion);
    }

    @Transactional
    public void deleteQuestion(@org.springframework.lang.NonNull UUID id) {
        if (!toeicQuestionRepository.existsById(id)) {
            throw new ResourceNotFoundException("ToeicQuestion", "id", id);
        }
        toeicQuestionRepository.deleteById(id);
    }

    private ToeicQuestionResponse mapToResponse(ToeicQuestion question) {
        ToeicQuestionResponse response = new ToeicQuestionResponse();
        response.setId(question.getId());
        response.setPartId(question.getPartId());
        response.setContent(question.getContent());
        response.setAudioUrl(question.getAudioUrl());
        response.setImageUrl(question.getImageUrl());
        response.setPassage(question.getPassage());
        response.setCorrectAnswer(question.getCorrectAnswer());
        response.setCreatedAt(question.getCreatedAt());
        response.setUpdatedAt(question.getUpdatedAt());
        return response;
    }
}
