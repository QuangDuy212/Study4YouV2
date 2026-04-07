package com.study4you.toeic.part.service;

import com.study4you.common.dto.PageResponse;
import com.study4you.common.exception.ResourceNotFoundException;
import com.study4you.toeic.part.dto.ToeicPartRequest;
import com.study4you.toeic.part.dto.ToeicPartResponse;
import com.study4you.toeic.part.entity.ToeicPart;
import com.study4you.toeic.part.repository.ToeicPartRepository;
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
public class ToeicPartService {

    private final ToeicPartRepository toeicPartRepository;

    @Transactional(readOnly = true)
    public PageResponse<ToeicPartResponse> getAllParts(@org.springframework.lang.NonNull Pageable pageable) {
        Page<ToeicPart> partPage = toeicPartRepository.findAll(pageable);
        List<ToeicPartResponse> parts = partPage.getContent().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        
        return new PageResponse<>(
                parts,
                partPage.getNumber(),
                partPage.getSize(),
                partPage.getTotalElements(),
                partPage.getTotalPages(),
                partPage.isLast()
        );
    }

    @Transactional(readOnly = true)
    public ToeicPartResponse getPartById(@org.springframework.lang.NonNull UUID id) {
        ToeicPart part = toeicPartRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ToeicPart", "id", id));
        return mapToResponse(part);
    }

    @Transactional
    public ToeicPartResponse createPart(ToeicPartRequest request) {
        ToeicPart part = new ToeicPart();
        part.setTestId(request.getTestId());
        part.setPart(request.getPart());
        part.setOrderIndex(request.getOrderIndex());

        ToeicPart savedPart = toeicPartRepository.save(part);
        return mapToResponse(savedPart);
    }

    @Transactional
    public ToeicPartResponse updatePart(@org.springframework.lang.NonNull UUID id, ToeicPartRequest request) {
        ToeicPart part = toeicPartRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ToeicPart", "id", id));

        part.setTestId(request.getTestId());
        part.setPart(request.getPart());
        part.setOrderIndex(request.getOrderIndex());

        ToeicPart updatedPart = toeicPartRepository.save(part);
        return mapToResponse(updatedPart);
    }

    @Transactional
    public void deletePart(@org.springframework.lang.NonNull UUID id) {
        if (!toeicPartRepository.existsById(id)) {
            throw new ResourceNotFoundException("ToeicPart", "id", id);
        }
        toeicPartRepository.deleteById(id);
    }

    private ToeicPartResponse mapToResponse(ToeicPart part) {
        ToeicPartResponse response = new ToeicPartResponse();
        response.setId(part.getId());
        response.setTestId(part.getTestId());
        response.setPart(part.getPart());
        response.setOrderIndex(part.getOrderIndex());
        response.setCreatedAt(part.getCreatedAt());
        response.setUpdatedAt(part.getUpdatedAt());
        return response;
    }
}
