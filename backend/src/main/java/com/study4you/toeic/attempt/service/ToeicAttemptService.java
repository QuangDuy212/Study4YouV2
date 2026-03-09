package com.study4you.toeic.attempt.service;

import com.study4you.common.activity.UserActivityService;
import com.study4you.common.dto.PageResponse;
import com.study4you.common.exception.ResourceNotFoundException;
import com.study4you.toeic.attempt.dto.ToeicAttemptRequest;
import com.study4you.toeic.attempt.dto.ToeicAttemptResponse;
import com.study4you.toeic.attempt.entity.ToeicAttempt;
import com.study4you.toeic.attempt.repository.ToeicAttemptRepository;
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
public class ToeicAttemptService {

    private final ToeicAttemptRepository toeicAttemptRepository;
    private final UserActivityService userActivityService;

    @Transactional(readOnly = true)
    public PageResponse<ToeicAttemptResponse> getAllAttempts(@org.springframework.lang.NonNull Pageable pageable) {
        Page<ToeicAttempt> attemptPage = toeicAttemptRepository.findAll(pageable);
        List<ToeicAttemptResponse> attempts = attemptPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        
        return new PageResponse<>(
                attempts,
                attemptPage.getNumber(),
                attemptPage.getSize(),
                attemptPage.getTotalElements(),
                attemptPage.getTotalPages(),
                attemptPage.isLast()
        );
    }

    @Transactional(readOnly = true)
    public ToeicAttemptResponse getAttemptById(@org.springframework.lang.NonNull UUID id) {
        ToeicAttempt attempt = toeicAttemptRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ToeicAttempt", "id", id));
        return mapToResponse(attempt);
    }

    @Transactional
    public ToeicAttemptResponse createAttempt(ToeicAttemptRequest request) {
        ToeicAttempt attempt = new ToeicAttempt();
        attempt.setUserId(request.getUserId());
        attempt.setTestId(request.getTestId());
        attempt.setStartedAt(request.getStartedAt());
        attempt.setSubmittedAt(request.getSubmittedAt());
        attempt.setRawScore(request.getRawScore());
        attempt.setToeicScore(request.getToeicScore());

        ToeicAttempt savedAttempt = toeicAttemptRepository.save(attempt);

        userActivityService.logActivity(
                savedAttempt.getUserId(),
                "START_TEST",
                "Started TOEIC test",
                "TEST",
                savedAttempt.getTestId()
        );

        return mapToResponse(savedAttempt);
    }

    @Transactional
    public ToeicAttemptResponse updateAttempt(@org.springframework.lang.NonNull UUID id, ToeicAttemptRequest request) {
        ToeicAttempt attempt = toeicAttemptRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ToeicAttempt", "id", id));

        attempt.setUserId(request.getUserId());
        attempt.setTestId(request.getTestId());
        attempt.setStartedAt(request.getStartedAt());
        attempt.setSubmittedAt(request.getSubmittedAt());
        attempt.setRawScore(request.getRawScore());
        attempt.setToeicScore(request.getToeicScore());

        ToeicAttempt updatedAttempt = toeicAttemptRepository.save(attempt);

        // Log SUBMIT_TEST when the attempt has a submittedAt timestamp
        if (updatedAttempt.getSubmittedAt() != null) {
            userActivityService.logActivity(
                    updatedAttempt.getUserId(),
                    "SUBMIT_TEST",
                    "Submitted TOEIC test",
                    "TEST",
                    updatedAttempt.getTestId()
            );
        }

        return mapToResponse(updatedAttempt);
    }

    @Transactional
    public void deleteAttempt(@org.springframework.lang.NonNull UUID id) {
        if (!toeicAttemptRepository.existsById(id)) {
            throw new ResourceNotFoundException("ToeicAttempt", "id", id);
        }
        toeicAttemptRepository.deleteById(id);
    }

    private ToeicAttemptResponse mapToResponse(ToeicAttempt attempt) {
        ToeicAttemptResponse response = new ToeicAttemptResponse();
        response.setId(attempt.getId());
        response.setUserId(attempt.getUserId());
        response.setTestId(attempt.getTestId());
        response.setStartedAt(attempt.getStartedAt());
        response.setSubmittedAt(attempt.getSubmittedAt());
        response.setRawScore(attempt.getRawScore());
        response.setToeicScore(attempt.getToeicScore());
        response.setCreatedAt(attempt.getCreatedAt());
        response.setUpdatedAt(attempt.getUpdatedAt());
        return response;
    }
}
