package com.study4you.toeic.attempt.service;

import com.study4you.common.exception.ResourceNotFoundException;
import com.study4you.security.SecurityService;
import com.study4you.toeic.answer.entity.ToeicAnswer;
import com.study4you.toeic.answer.repository.ToeicAnswerRepository;
import com.study4you.toeic.attempt.dto.ReviewOptionDTO;
import com.study4you.toeic.attempt.dto.ReviewQuestionDTO;
import com.study4you.toeic.attempt.dto.TestReviewResponse;
import com.study4you.toeic.attempt.entity.ToeicAttempt;
import com.study4you.toeic.attempt.repository.ToeicAttemptRepository;
import com.study4you.toeic.option.entity.ToeicOption;
import com.study4you.toeic.test.entity.ToeicTest;
import com.study4you.toeic.test.repository.ToeicTestRepository;
import com.study4you.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TestReviewService {

    private final ToeicAttemptRepository attemptRepository;
    private final ToeicAnswerRepository answerRepository;
    private final ToeicTestRepository testRepository;
    private final SecurityService securityService;

    @Transactional(readOnly = true)
    public TestReviewResponse getReview(UUID submissionId) {
        // 1. Load attempt
        ToeicAttempt attempt = attemptRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("ToeicAttempt", "id", submissionId));

        // 2. Ownership check
        User currentUser = securityService.getCurrentUser();
        if (currentUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
        }
        
        boolean isAdmin = currentUser.getRoles() != null &&
                currentUser.getRoles().stream()
                        .anyMatch(r -> r.getName() != null && r.getName().toUpperCase().contains("ADMIN"));
                        
        if (!attempt.getUserId().equals(currentUser.getId()) && !isAdmin) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You do not have permission to view this submission");
        }

        // 3. Load the test (findById đã được thêm EntityGraph để fetch Parts)
        ToeicTest test = testRepository.findById(attempt.getTestId())
                .orElseThrow(() -> new ResourceNotFoundException("ToeicTest", "id", attempt.getTestId()));

        // 4. Load all saved answers for this attempt → map by questionId
        List<ToeicAnswer> savedAnswers = answerRepository.findByAttemptId(submissionId);
        Map<UUID, ToeicAnswer> answerMap = savedAnswers.stream()
                .collect(Collectors.toMap(ToeicAnswer::getQuestionId, a -> a, (a1, a2) -> a1));

        // 5. Build question review list
        AtomicInteger questionNumber = new AtomicInteger(1);
        List<ReviewQuestionDTO> questionDTOs = test.getParts().stream()
                .sorted(Comparator.comparingInt(p -> p.getOrderIndex()))
                .flatMap(part -> {
                    String partName = part.getPart() != null ? part.getPart().name() : "";
                    // Truy cập vào questions sẽ trigger lazy loading vì đang trong @Transactional
                    List<com.study4you.toeic.question.entity.ToeicQuestion> qs = part.getQuestions();
                    if (qs == null) return java.util.stream.Stream.empty();
                    
                    return qs.stream()
                            .sorted(Comparator.comparing(q -> q.getCreatedAt()))
                            .map(question -> buildQuestionDTO(question, answerMap, questionNumber.getAndIncrement(), partName));
                })
                .collect(Collectors.toList());

        // 6. Compute stats
        int totalQuestions = questionDTOs.size();
        long correctCount = questionDTOs.stream().filter(ReviewQuestionDTO::isCorrect).count();
        long answeredCount = questionDTOs.stream().filter(q -> q.getUserAnswer() != null).count();
        long unansweredCount = totalQuestions - answeredCount;
        long wrongCount = answeredCount - correctCount;

        // 7. Completion time
        Long completionSecs = null;
        if (attempt.getStartedAt() != null && attempt.getSubmittedAt() != null) {
            completionSecs = Duration.between(attempt.getStartedAt(), attempt.getSubmittedAt()).getSeconds();
        }

        // 8. Build response
        TestReviewResponse response = new TestReviewResponse();
        response.setSubmissionId(submissionId);
        response.setTestId(attempt.getTestId());
        response.setTestTitle(test.getTitle());
        response.setUserId(attempt.getUserId());
        response.setToeicScore(attempt.getToeicScore());
        response.setRawScore((int) correctCount);
        response.setTotalQuestions(totalQuestions);
        response.setWrongCount((int) wrongCount);
        response.setUnansweredCount((int) unansweredCount);
        response.setStartedAt(attempt.getStartedAt());
        response.setSubmittedAt(attempt.getSubmittedAt());
        response.setCompletionTimeSeconds(completionSecs);
        response.setQuestions(questionDTOs);

        return response;
    }

    private ReviewQuestionDTO buildQuestionDTO(
            com.study4you.toeic.question.entity.ToeicQuestion question,
            Map<UUID, ToeicAnswer> answerMap,
            int questionNumber,
            String partName) {

        // Truy cập options trigger lazy loading
        List<ReviewOptionDTO> options = question.getOptions() == null ? List.of() :
                question.getOptions().stream()
                        .sorted(Comparator.comparing(ToeicOption::getLabel))
                        .map(o -> new ReviewOptionDTO(o.getLabel(), o.getContent()))
                        .collect(Collectors.toList());

        ToeicAnswer saved = answerMap.get(question.getId());
        String userAnswer = (saved != null) ? saved.getSelectedOption() : null;
        boolean isCorrect = saved != null && Boolean.TRUE.equals(saved.getCorrect());

        ReviewQuestionDTO dto = new ReviewQuestionDTO();
        dto.setQuestionId(question.getId());
        dto.setQuestionNumber(questionNumber);
        dto.setContent(question.getContent());
        dto.setPassage(question.getPassage());
        dto.setImageUrl(question.getImageUrl());
        dto.setAudioUrl(question.getAudioUrl());
        dto.setOptions(options);
        dto.setUserAnswer(userAnswer);
        dto.setCorrectAnswer(question.getCorrectAnswer());
        dto.setExplanation(question.getExplanation());
        dto.setCorrect(isCorrect);
        dto.setFlagged(saved != null && Boolean.TRUE.equals(saved.getIsFlagged()));
        dto.setPartName(partName);

        return dto;
    }
}
