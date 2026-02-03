package com.study4you.toeic.test.service;

import com.study4you.common.dto.PageResponse;
import com.study4you.common.exception.ResourceNotFoundException;
import com.study4you.toeic.test.dto.ToeicTestRequest;
import com.study4you.toeic.test.dto.ToeicTestResponse;
import com.study4you.toeic.test.entity.ToeicTest;
import com.study4you.toeic.test.repository.ToeicTestRepository;
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
public class ToeicTestService {

    private final ToeicTestRepository toeicTestRepository;

    @Transactional(readOnly = true)
    public PageResponse<ToeicTestResponse> getAllTests(@org.springframework.lang.NonNull Pageable pageable) {
        Page<ToeicTest> testPage = toeicTestRepository.findAll(pageable);
        List<ToeicTestResponse> tests = testPage.getContent().stream()
                .map(this::mapToResponse)
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
        return mapToResponse(test);
    }

    @Transactional
    public ToeicTestResponse createTest(ToeicTestRequest request) {
        ToeicTest test = new ToeicTest();
        test.setTitle(request.getTitle());
        test.setTestType(request.getTestType());
        test.setSkill(request.getSkill());
        test.setLevel(request.getLevel());
        test.setDurationMinutes(request.getDurationMinutes());
        test.setActive(request.getActive() != null ? request.getActive() : true);

        ToeicTest savedTest = toeicTestRepository.save(test);
        return mapToResponse(savedTest);
    }

    @Transactional
    public ToeicTestResponse updateTest(@org.springframework.lang.NonNull UUID id, ToeicTestRequest request) {
        ToeicTest test = toeicTestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ToeicTest", "id", id));

        test.setTitle(request.getTitle());
        test.setTestType(request.getTestType());
        test.setSkill(request.getSkill());
        test.setLevel(request.getLevel());
        test.setDurationMinutes(request.getDurationMinutes());
        if (request.getActive() != null) {
            test.setActive(request.getActive());
        }

        ToeicTest updatedTest = toeicTestRepository.save(test);
        return mapToResponse(updatedTest);
    }

    @Transactional
    public void deleteTest(@org.springframework.lang.NonNull UUID id) {
        if (!toeicTestRepository.existsById(id)) {
            throw new ResourceNotFoundException("ToeicTest", "id", id);
        }
        toeicTestRepository.deleteById(id);
    }

    private ToeicTestResponse mapToResponse(ToeicTest test) {
        ToeicTestResponse response = new ToeicTestResponse();
        response.setId(test.getId());
        response.setTitle(test.getTitle());
        response.setTestType(test.getTestType());
        response.setSkill(test.getSkill());
        response.setLevel(test.getLevel());
        response.setDurationMinutes(test.getDurationMinutes());
        response.setActive(test.getActive());
        response.setCreatedAt(test.getCreatedAt());
        response.setUpdatedAt(test.getUpdatedAt());
        return response;
    }
}
