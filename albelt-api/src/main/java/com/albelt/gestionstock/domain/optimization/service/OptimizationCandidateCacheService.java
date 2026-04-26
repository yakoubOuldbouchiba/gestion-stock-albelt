package com.albelt.gestionstock.domain.optimization.service;

import com.albelt.gestionstock.domain.optimization.data.OptimizationCandidateFilter;
import com.albelt.gestionstock.domain.optimization.data.OptimizationCandidateFingerprint;
import com.albelt.gestionstock.domain.optimization.data.OptimizationSourceSnapshot;
import com.albelt.gestionstock.domain.rolls.repository.RollRepository;
import com.albelt.gestionstock.domain.waste.repository.WastePieceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class OptimizationCandidateCacheService {

    private final RollRepository rollRepository;
    private final WastePieceRepository wastePieceRepository;

    @Cacheable(cacheNames = "optimizationRollCandidates", key = "#filter.toString() + '|' + #fingerprint.cacheToken()")
    public List<OptimizationSourceSnapshot> getRollCandidates(OptimizationCandidateFilter filter,
                                                              OptimizationCandidateFingerprint fingerprint) {
        return rollRepository.findOptimizationCandidates(
            filter.articleId(),
            filter.colorId(),
            filter.altierId()
        );
    }

    @Cacheable(cacheNames = "optimizationWasteCandidates", key = "#filter.toString() + '|' + #fingerprint.cacheToken()")
    public List<OptimizationSourceSnapshot> getWasteCandidates(OptimizationCandidateFilter filter,
                                                               OptimizationCandidateFingerprint fingerprint) {
        return wastePieceRepository.findOptimizationCandidates(
            filter.articleId(),
            filter.colorId(),
            filter.altierId()
        );
    }
}
