package com.study4you.toeic.option.service;

import com.study4you.common.dto.PageResponse;
import com.study4you.common.exception.ResourceNotFoundException;
import com.study4you.toeic.option.dto.ToeicOptionRequest;
import com.study4you.toeic.option.dto.ToeicOptionResponse;
import com.study4you.toeic.option.entity.ToeicOption;
import com.study4you.toeic.option.repository.ToeicOptionRepository;
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
public class ToeicOptionService {

    private final ToeicOptionRepository toeicOptionRepository;

    @Transactional(readOnly = true)
    public PageResponse<ToeicOptionResponse> getAllOptions(@org.springframework.lang.NonNull Pageable pageable) {
        Page<ToeicOption> optionPage = toeicOptionRepository.findAll(pageable);
        List<ToeicOptionResponse> options = optionPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        
        return new PageResponse<>(
                options,
                optionPage.getNumber(),
                optionPage.getSize(),
                optionPage.getTotalElements(),
                optionPage.getTotalPages(),
                optionPage.isLast()
        );
    }

    @Transactional(readOnly = true)
    public ToeicOptionResponse getOptionById(@org.springframework.lang.NonNull UUID id) {
        ToeicOption option = toeicOptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ToeicOption", "id", id));
        return mapToResponse(option);
    }

    @Transactional
    public ToeicOptionResponse createOption(ToeicOptionRequest request) {
        ToeicOption option = new ToeicOption();
        option.setQuestionId(request.getQuestionId());
        option.setLabel(request.getLabel());
        option.setContent(request.getContent());

        ToeicOption savedOption = toeicOptionRepository.save(option);
        return mapToResponse(savedOption);
    }

    @Transactional
    public ToeicOptionResponse updateOption(@org.springframework.lang.NonNull UUID id, ToeicOptionRequest request) {
        ToeicOption option = toeicOptionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ToeicOption", "id", id));

        option.setQuestionId(request.getQuestionId());
        option.setLabel(request.getLabel());
        option.setContent(request.getContent());

        ToeicOption updatedOption = toeicOptionRepository.save(option);
        return mapToResponse(updatedOption);
    }

    @Transactional
    public void deleteOption(@org.springframework.lang.NonNull UUID id) {
        if (!toeicOptionRepository.existsById(id)) {
            throw new ResourceNotFoundException("ToeicOption", "id", id);
        }
        toeicOptionRepository.deleteById(id);
    }

    private ToeicOptionResponse mapToResponse(ToeicOption option) {
        ToeicOptionResponse response = new ToeicOptionResponse();
        response.setId(option.getId());
        response.setLabel(option.getLabel());
        response.setContent(option.getContent());
        return response;
    }
}
