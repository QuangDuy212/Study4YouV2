package com.study4you.toeic.question.service;

import com.study4you.common.dto.PageResponse;
import com.study4you.common.exception.ResourceNotFoundException;
import com.study4you.toeic.question.dto.ToeicQuestionRequest;
import com.study4you.toeic.question.dto.ToeicQuestionResponse;
import com.study4you.toeic.question.entity.ToeicQuestion;
import com.study4you.toeic.question.repository.ToeicQuestionRepository;
import com.study4you.toeic.part.entity.ToeicPart;
import com.study4you.toeic.part.repository.ToeicPartRepository;
import com.study4you.toeic.option.entity.ToeicOption;
import com.study4you.toeic.option.repository.ToeicOptionRepository;
import com.study4you.toeic.option.dto.ToeicOptionResponse;
import com.study4you.common.enums.PartNumber;
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
    private final ToeicPartRepository toeicPartRepository;
    private final ToeicOptionRepository toeicOptionRepository;

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
        question.setTranscript(request.getTranscript());
        question.setCorrectAnswer(request.getCorrectAnswer());
        question.setLevel(request.getLevel());

        // Validate Part 2: Exactly 3 options
        ToeicPart part = toeicPartRepository.findById(request.getPartId())
                .orElseThrow(() -> new ResourceNotFoundException("ToeicPart", "id", request.getPartId()));
        if (part.getPart() == PartNumber.PART_2) {
            if (request.getOptions() == null || request.getOptions().size() != 3) {
                throw new IllegalArgumentException("Part 2 questions must have exactly 3 options (A, B, C).");
            }
        }

        ToeicQuestion savedQuestion = toeicQuestionRepository.save(question);
        
        if (request.getOptions() != null) {
            List<ToeicOption> optionsToSave = request.getOptions().stream().map(optReq -> {
                ToeicOption opt = new ToeicOption();
                opt.setQuestionId(savedQuestion.getId());
                opt.setLabel(optReq.getLabel());
                opt.setContent(optReq.getContent());
                return opt;
            }).collect(Collectors.toList());
            toeicOptionRepository.saveAll(optionsToSave);
        }

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
        question.setTranscript(request.getTranscript());
        question.setCorrectAnswer(request.getCorrectAnswer());
        question.setLevel(request.getLevel());

        // Validate Part 2: Exactly 3 options
        ToeicPart part = toeicPartRepository.findById(request.getPartId())
                .orElseThrow(() -> new ResourceNotFoundException("ToeicPart", "id", request.getPartId()));
        if (part.getPart() == PartNumber.PART_2) {
            if (request.getOptions() == null || request.getOptions().size() != 3) {
                throw new IllegalArgumentException("Part 2 questions must have exactly 3 options (A, B, C).");
            }
        }

        ToeicQuestion updatedQuestion = toeicQuestionRepository.save(question);
        
        if (request.getOptions() != null) {
            // Delete existing options then re-insert
            List<ToeicOption> existingOptions = toeicOptionRepository.findByQuestionId(updatedQuestion.getId());
            toeicOptionRepository.deleteAll(existingOptions);

            List<ToeicOption> newOptions = request.getOptions().stream().map(optReq -> {
                ToeicOption opt = new ToeicOption();
                opt.setQuestionId(updatedQuestion.getId());
                opt.setLabel(optReq.getLabel());
                opt.setContent(optReq.getContent());
                return opt;
            }).collect(Collectors.toList());
            toeicOptionRepository.saveAll(newOptions);
        }

        return mapToResponse(updatedQuestion);
    }

    @Transactional
    public void deleteQuestion(@org.springframework.lang.NonNull UUID id) {
        if (!toeicQuestionRepository.existsById(id)) {
            throw new ResourceNotFoundException("ToeicQuestion", "id", id);
        }
        toeicQuestionRepository.deleteById(id);
    }

    @Transactional
    public ToeicQuestionResponse updateAudioUrl(@org.springframework.lang.NonNull UUID id, String audioUrl) {
        throw new IllegalArgumentException("Audio is only allowed at the Part level, not individual questions.");
    }

    @Transactional
    public ToeicQuestionResponse updateImageUrl(@org.springframework.lang.NonNull UUID id, String imageUrl) {
        ToeicQuestion question = toeicQuestionRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ToeicQuestion", "id", id));
                
        ToeicPart part = toeicPartRepository.findById(question.getPartId())
                .orElseThrow(() -> new ResourceNotFoundException("ToeicPart", "id", question.getPartId()));
                
        if (part.getPart() != PartNumber.PART_1) {
            throw new IllegalArgumentException("Image is not allowed for this TOEIC part.");
        }
        
        question.setImageUrl(imageUrl);
        ToeicQuestion updatedQuestion = toeicQuestionRepository.save(question);
        return mapToResponse(updatedQuestion);
    }

    private ToeicQuestionResponse mapToResponse(ToeicQuestion question) {
        ToeicQuestionResponse response = new ToeicQuestionResponse();
        response.setId(question.getId());
        response.setPartId(question.getPartId());
        response.setContent(question.getContent());
        response.setAudioUrl(question.getAudioUrl());
        response.setImageUrl(question.getImageUrl());
        response.setPassage(question.getPassage());
        response.setTranscript(question.getTranscript());
        response.setCorrectAnswer(question.getCorrectAnswer());
        response.setLevel(question.getLevel());
        response.setCreatedAt(question.getCreatedAt());
        response.setUpdatedAt(question.getUpdatedAt());

        List<ToeicOption> options = toeicOptionRepository.findByQuestionId(question.getId());
        if (options != null) {
            List<ToeicOptionResponse> optionResponses = options.stream().map(opt -> {
                ToeicOptionResponse optRes = new ToeicOptionResponse();
                optRes.setId(opt.getId());
                optRes.setLabel(opt.getLabel());
                optRes.setContent(opt.getContent());
                return optRes;
            }).collect(Collectors.toList());
            response.setOptions(optionResponses);
        }

        return response;
    }
}
