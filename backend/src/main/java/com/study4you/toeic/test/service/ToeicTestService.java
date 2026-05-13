package com.study4you.toeic.test.service;

import com.study4you.common.activity.UserActivityService;
import com.study4you.common.dto.PageResponse;
import com.study4you.common.enums.Level;
import com.study4you.common.enums.PartNumber;
import com.study4you.common.enums.Skill;
import com.study4you.common.exception.ResourceNotFoundException;
import com.study4you.toeic.option.dto.ToeicOptionResponse;
import com.study4you.toeic.option.entity.ToeicOption;
import com.study4you.toeic.option.repository.ToeicOptionRepository;
import com.study4you.toeic.part.dto.ToeicPartResponse;
import com.study4you.toeic.part.entity.ToeicPart;
import com.study4you.toeic.part.repository.ToeicPartRepository;
import com.study4you.toeic.question.dto.ToeicQuestionResponse;
import com.study4you.toeic.question.entity.ToeicQuestion;
import com.study4you.toeic.question.repository.ToeicQuestionRepository;
import com.study4you.toeic.test.dto.ToeicTestRequest;
import com.study4you.toeic.test.dto.ToeicTestResponse;
import com.study4you.toeic.test.entity.ToeicTest;
import com.study4you.toeic.test.repository.ToeicTestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ToeicTestService {

    private final ToeicTestRepository toeicTestRepository;
    private final ToeicPartRepository toeicPartRepository;
    private final ToeicQuestionRepository toeicQuestionRepository;
    private final ToeicOptionRepository toeicOptionRepository;
    private final UserActivityService userActivityService;
    private final com.study4you.user.repository.UserRepository userRepository;

    // Standard TOEIC L&R: 7 parts with fixed question counts
    private static final PartNumber[] PART_ORDER = {
        PartNumber.PART_1, PartNumber.PART_2, PartNumber.PART_3, PartNumber.PART_4,
        PartNumber.PART_5, PartNumber.PART_6, PartNumber.PART_7
    };

    @Transactional(readOnly = true)
    public PageResponse<ToeicTestResponse> getAllTests(@org.springframework.lang.NonNull Pageable pageable) {
        Page<ToeicTest> testPage = toeicTestRepository.findAll(pageable);
        List<ToeicTestResponse> tests = testPage.getContent().stream()
                .map(this::mapToFlatResponse)
                .collect(Collectors.toList());
        
        return new PageResponse<>(
                tests,
                testPage.getNumber(),
                testPage.getSize(),
                testPage.getTotalElements(),
                testPage.getTotalPages(),
                testPage.isLast()
        );
    }

    @Transactional(readOnly = true)
    public ToeicTestResponse getTestById(@org.springframework.lang.NonNull UUID id) {
        ToeicTest test = toeicTestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ToeicTest", "id", id));
        return mapToNestedResponse(test);
    }

    @Transactional
    public ToeicTestResponse createTest(ToeicTestRequest request) {
        ToeicTest test = new ToeicTest();
        test.setTitle(request.getTitle());
        test.setDurationMinutes(120);
        test.setActive(request.getActive() != null ? request.getActive() : true);
        
        if (request.getSkill() != null) test.setSkill(Skill.valueOf(request.getSkill().toUpperCase()));
        if (request.getLevel() != null) test.setLevel(Level.valueOf(request.getLevel().toUpperCase()));
        test.setAudioUrl(request.getAudioUrl());

        ToeicTest savedTest = toeicTestRepository.save(test);

        // Auto-create 7 standard parts
        for (int i = 0; i < PART_ORDER.length; i++) {
            ToeicPart part = new ToeicPart();
            part.setTestId(savedTest.getId());
            part.setPart(PART_ORDER[i]);
            part.setOrderIndex(i + 1);
            toeicPartRepository.save(part);
        }

        userActivityService.logActivity(
                getCurrentUserId(),
                "CREATE_TEST",
                "Created TOEIC test: " + savedTest.getTitle(),
                "TEST",
                savedTest.getId()
        );

        return mapToFlatResponse(savedTest);
    }

    @Transactional
    public ToeicTestResponse updateTest(@org.springframework.lang.NonNull UUID id, ToeicTestRequest request) {
        ToeicTest test = toeicTestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ToeicTest", "id", id));

        test.setTitle(request.getTitle());
        if (request.getActive() != null) {
            // If changing to false, set deletedAt. If true, clear it.
            if (Boolean.TRUE.equals(test.getActive()) && Boolean.FALSE.equals(request.getActive())) {
                test.setDeletedAt(LocalDateTime.now());
            } else if (Boolean.FALSE.equals(test.getActive()) && Boolean.TRUE.equals(request.getActive())) {
                test.setDeletedAt(null);
            }
            test.setActive(request.getActive());
        }
        if (request.getSkill() != null) {
            test.setSkill(Skill.valueOf(request.getSkill().toUpperCase()));
        }
        if (request.getLevel() != null) {
            test.setLevel(Level.valueOf(request.getLevel().toUpperCase()));
        }
        if (request.getAudioUrl() != null || test.getAudioUrl() != null) {
            test.setAudioUrl(request.getAudioUrl());
        }

        ToeicTest updatedTest = toeicTestRepository.save(test);

        userActivityService.logActivity(
                getCurrentUserId(),
                "UPDATE_TEST",
                "Updated TOEIC test: " + updatedTest.getTitle(),
                "TEST",
                updatedTest.getId()
        );

        return mapToFlatResponse(updatedTest);
    }

    @Transactional
    public ToeicTestResponse updateAudioUrl(@org.springframework.lang.NonNull UUID id, String audioUrl) {
        ToeicTest test = toeicTestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ToeicTest", "id", id));
        test.setAudioUrl(audioUrl);
        ToeicTest updatedTest = toeicTestRepository.save(test);
        return mapToFlatResponse(updatedTest);
    }

    @Transactional
    public void deleteTest(@org.springframework.lang.NonNull UUID id) {
        if (!toeicTestRepository.existsById(id)) {
            throw new ResourceNotFoundException("ToeicTest", "id", id);
        }
        toeicTestRepository.deleteById(id);

        userActivityService.logActivity(
                getCurrentUserId(),
                "DELETE_TEST",
                "Deleted TOEIC test with id: " + id,
                "TEST",
                id
        );
    }

    // Helper: extract current authenticated user's ID from SecurityContext via email lookup
    private UUID getCurrentUserId() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && auth.getName() != null) {
                return userRepository.findByEmail(auth.getName())
                        .map(user -> user.getId())
                        .orElse(null);
            }
        } catch (Exception ignored) {
            // If we cannot resolve the user ID, return null — logging is best-effort
        }
        return null;
    }

    // Flat response (no nested data) – used in list/create/update
    private ToeicTestResponse mapToFlatResponse(ToeicTest test) {
        ToeicTestResponse response = new ToeicTestResponse();
        response.setId(test.getId());
        response.setTitle(test.getTitle());
        response.setDurationMinutes(test.getDurationMinutes());
        response.setActive(test.getActive());
        response.setSkill(test.getSkill().name());
        response.setLevel(test.getLevel().name());
        response.setAudioUrl(test.getAudioUrl());
        response.setCreatedAt(test.getCreatedAt());
        response.setUpdatedAt(test.getUpdatedAt());
        return response;
    }

    // Nested response: Test → Parts → Questions → Options – used in getById
    private ToeicTestResponse mapToNestedResponse(ToeicTest test) {
        ToeicTestResponse response = mapToFlatResponse(test);

        List<ToeicPart> parts = toeicPartRepository.findByTestIdOrderByOrderIndexAsc(test.getId());
        List<ToeicPartResponse> partResponses = parts.stream()
                .map(part -> {
                    ToeicPartResponse partResponse = new ToeicPartResponse();
                    partResponse.setId(part.getId());
                    partResponse.setTestId(part.getTestId());
                    partResponse.setPart(part.getPart());
                    partResponse.setOrderIndex(part.getOrderIndex());
                    partResponse.setCreatedAt(part.getCreatedAt());
                    partResponse.setUpdatedAt(part.getUpdatedAt());

                    List<ToeicQuestion> questions = toeicQuestionRepository.findByPartId(part.getId());
                    List<ToeicQuestionResponse> questionResponses = questions.stream()
                            .map(question -> {
                                ToeicQuestionResponse questionResponse = new ToeicQuestionResponse();
                                questionResponse.setId(question.getId());
                                questionResponse.setPartId(question.getPartId());
                                questionResponse.setContent(question.getContent());
                                questionResponse.setAudioUrl(question.getAudioUrl());
                                questionResponse.setImageUrl(question.getImageUrl());
                                questionResponse.setPassage(question.getPassage());
                                questionResponse.setCorrectAnswer(question.getCorrectAnswer());
                                questionResponse.setCreatedAt(question.getCreatedAt());
                                questionResponse.setUpdatedAt(question.getUpdatedAt());

                                List<ToeicOption> options = toeicOptionRepository.findByQuestionId(question.getId());
                                List<ToeicOptionResponse> optionResponses = options.stream()
                                        .map(option -> {
                                            ToeicOptionResponse optionResponse = new ToeicOptionResponse();
                                            optionResponse.setId(option.getId());
                                            optionResponse.setLabel(option.getLabel());
                                            optionResponse.setContent(option.getContent());
                                            return optionResponse;
                                        })
                                        .collect(Collectors.toList());
                                questionResponse.setOptions(optionResponses);
                                return questionResponse;
                            })
                            .collect(Collectors.toList());
                    partResponse.setQuestions(questionResponses);
                    return partResponse;
                })
                .collect(Collectors.toList());

        response.setParts(partResponses);
        return response;
    }
}
