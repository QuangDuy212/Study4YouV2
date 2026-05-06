package com.study4you.toeic.answer.service;

import com.study4you.common.dto.PageResponse;
import com.study4you.common.exception.ResourceNotFoundException;
import com.study4you.toeic.answer.dto.ToeicAnswerRequest;
import com.study4you.toeic.answer.dto.ToeicAnswerResponse;
import com.study4you.toeic.answer.entity.ToeicAnswer;
import com.study4you.toeic.answer.repository.ToeicAnswerRepository;
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
public class ToeicAnswerService {

    private final ToeicAnswerRepository toeicAnswerRepository;

    @Transactional(readOnly = true)
    public PageResponse<ToeicAnswerResponse> getAllAnswers(@org.springframework.lang.NonNull Pageable pageable) {
        Page<ToeicAnswer> answerPage = toeicAnswerRepository.findAll(pageable);
        List<ToeicAnswerResponse> answers = answerPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        
        return new PageResponse<>(
                answers,
                answerPage.getNumber(),
                answerPage.getSize(),
                answerPage.getTotalElements(),
                answerPage.getTotalPages(),
                answerPage.isLast()
        );
    }

    @Transactional(readOnly = true)
    public ToeicAnswerResponse getAnswerById(@org.springframework.lang.NonNull UUID id) {
        ToeicAnswer answer = toeicAnswerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ToeicAnswer", "id", id));
        return mapToResponse(answer);
    }

    @Transactional
    public ToeicAnswerResponse createAnswer(ToeicAnswerRequest request) {
        ToeicAnswer answer = new ToeicAnswer();
        answer.setAttemptId(request.getAttemptId());
        answer.setQuestionId(request.getQuestionId());
        answer.setSelectedOption(request.getSelectedOption());
        answer.setCorrect(request.getCorrect());
        answer.setIsFlagged(request.getIsFlagged());

        ToeicAnswer savedAnswer = toeicAnswerRepository.save(answer);
        return mapToResponse(savedAnswer);
    }

    @Transactional
    public ToeicAnswerResponse updateAnswer(@org.springframework.lang.NonNull UUID id, ToeicAnswerRequest request) {
        ToeicAnswer answer = toeicAnswerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ToeicAnswer", "id", id));

        answer.setAttemptId(request.getAttemptId());
        answer.setQuestionId(request.getQuestionId());
        answer.setSelectedOption(request.getSelectedOption());
        answer.setCorrect(request.getCorrect());
        answer.setIsFlagged(request.getIsFlagged());

        ToeicAnswer updatedAnswer = toeicAnswerRepository.save(answer);
        return mapToResponse(updatedAnswer);
    }

    @Transactional
    public void deleteAnswer(@org.springframework.lang.NonNull UUID id) {
        if (!toeicAnswerRepository.existsById(id)) {
            throw new ResourceNotFoundException("ToeicAnswer", "id", id);
        }
        toeicAnswerRepository.deleteById(id);
    }

    private ToeicAnswerResponse mapToResponse(ToeicAnswer answer) {
        ToeicAnswerResponse response = new ToeicAnswerResponse();
        response.setId(answer.getId());
        response.setAttemptId(answer.getAttemptId());
        response.setQuestionId(answer.getQuestionId());
        response.setSelectedOption(answer.getSelectedOption());
        response.setCorrect(answer.getCorrect());
        response.setCreatedAt(answer.getCreatedAt());
        response.setUpdatedAt(answer.getUpdatedAt());
        return response;
    }
}
