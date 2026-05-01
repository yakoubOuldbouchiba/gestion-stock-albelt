package com.albelt.gestionstock.domain.rolls.service;

import com.albelt.gestionstock.domain.altier.entity.Altier;
import com.albelt.gestionstock.domain.altier.service.AltierService;
import com.albelt.gestionstock.domain.rolls.dto.TransferBonDTO;
import com.albelt.gestionstock.domain.rolls.entity.Roll;
import com.albelt.gestionstock.domain.rolls.entity.RollMovement;
import com.albelt.gestionstock.domain.rolls.entity.TransferBon;
import com.albelt.gestionstock.domain.rolls.mapper.TransferBonMapper;
import com.albelt.gestionstock.domain.rolls.repository.RollMovementRepository;
import com.albelt.gestionstock.domain.rolls.repository.TransferBonRepository;
import com.albelt.gestionstock.domain.users.entity.User;
import com.albelt.gestionstock.domain.users.service.UserService;
import com.albelt.gestionstock.domain.waste.entity.WastePiece;
import com.albelt.gestionstock.domain.waste.service.WastePieceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for Transfer Bon management
 * Implements batch roll transfer workflow between altiers (workshops)
 * <p>
 * TransferBon represents a batch transfer document:
 * - Groups multiple roll movements under one transfer operation
 * - Tracks sortie (departure) and entree (receipt) phases
 * - Maintains audit trail with operator and timestamps
 * - Linked to individual RollMovement records for detailed tracking
 * <p>
 * Status workflow:
 * - NEW: Created but not yet departed
 * - statusSortie: Set when first movement departs
 * - statusEntree: Set when receipt is confirmed
 * - Once entree confirmed, all linked roll locations are updated
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TransferBonService {

    private final TransferBonRepository transferBonRepository;
    private final TransferBonMapper transferBonMapper;
    private final RollMovementRepository rollMovementRepository;
    private final RollService rollService;
    private final WastePieceService wastePieceService;
    private final AltierService altierService;
    private final UserService userService;

    @Transactional
    public TransferBonDTO createBon(UUID fromAltierId, UUID toAltierId, LocalDateTime dateSortie, LocalDateTime dateEntree,
                                    UUID operatorId, String notes) {
        Altier fromAltier = altierService.getById(fromAltierId);
        Altier toAltier = altierService.getById(toAltierId);
        User operator = userService.getById(operatorId);

        TransferBon bon = TransferBon.builder()
                .fromAltier(fromAltier)
                .toAltier(toAltier)
                .dateSortie(dateSortie)
                .dateEntree(dateEntree)
                .statusSortie(dateSortie != null)
                .statusEntree(dateEntree != null)
                .operator(operator)
                .notes(notes)
                .build();

        bon = transferBonRepository.save(bon);
        return transferBonMapper.toSummaryDTO(bon);
    }

    @Transactional(readOnly = true)
    public List<TransferBonDTO> listBons() {
        return transferBonRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(transferBonMapper::toSummaryDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<TransferBonDTO> listBonsPaged(UUID fromAltierId, UUID toAltierId, Boolean statusEntree,
                                              LocalDateTime fromDate, LocalDateTime toDate,
                                              String search, int page, int size) {
        String normalizedSearch = normalizeSearch(search);
        LocalDateTime safeFromDate = fromDate != null ? fromDate : LocalDateTime.of(1970, 1, 1, 0, 0);
        LocalDateTime safeToDate = toDate != null ? toDate : LocalDateTime.of(2100, 1, 1, 0, 0);
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return transferBonRepository.findFiltered(fromAltierId, toAltierId, statusEntree, safeFromDate, safeToDate, normalizedSearch, pageable)
                .map(transferBonMapper::toSummaryDTO);
    }

    @Transactional(readOnly = true)
    public TransferBonDTO getBonDetails(UUID bonId) {
        TransferBon bon = transferBonRepository.findWithMovementsById(bonId)
                .orElseThrow(() -> new RuntimeException("Transfer bon not found: " + bonId));
        return transferBonMapper.toDetailsDTO(bon);
    }

    @Transactional
    public TransferBonDTO updateBon(UUID bonId, TransferBonDTO dto) {
        TransferBon bon = transferBonRepository.findById(bonId)
                .orElseThrow(() -> new RuntimeException("Transfer bon not found: " + bonId));

        if (dto.getNotes() != null) {
            bon.setNotes(dto.getNotes());
        }
        if (dto.getDateSortie() != null) {
            bon.setDateSortie(dto.getDateSortie());
            bon.setStatusSortie(true);
        }
        if (dto.getDateEntree() != null) {
            bon.setDateEntree(dto.getDateEntree());
            bon.setStatusEntree(true);
        }

        bon = transferBonRepository.save(bon);
        return transferBonMapper.toSummaryDTO(bon);
    }

    /**
     * Confirm receipt of a transfer bon. By default this also confirms receipt for all linked roll movements
     * that do not yet have an entry date.
     */
    @Transactional
    public TransferBonDTO confirmReceipt(UUID bonId, LocalDateTime dateEntree) {
        TransferBon bon = transferBonRepository.findById(bonId)
                .orElseThrow(() -> new RuntimeException("Transfer bon not found: " + bonId));

        bon.setDateEntree(dateEntree);
        bon.setStatusEntree(true);
        bon = transferBonRepository.save(bon);

        List<RollMovement> pendingMovements = rollMovementRepository
                .findByTransferBon_IdAndDateEntreeIsNullOrderByCreatedAtDesc(bonId);

        for (RollMovement movement : pendingMovements) {
            movement.setDateEntree(dateEntree);
            movement.setStatusEntree(true);
            rollMovementRepository.save(movement);

            // Update roll location as in RollMovementService.confirmReceipt
            Roll roll = movement.getRoll();
            if (roll != null) {
                roll.setAltier(movement.getToAltier());
                rollService.save(roll);
            }

            WastePiece wastePiece = movement.getWastePiece();
            if (wastePiece != null) {
                wastePiece.setAltier(movement.getToAltier());
                wastePieceService.save(wastePiece);
            }
        }

        log.info("Confirmed receipt for transfer bon {} and {} pending movements", bonId, pendingMovements.size());
        return transferBonMapper.toSummaryDTO(bon);
    }

    /**
     * Delete a transfer bon only if it is still pending (not received).
     * For safety, deletion is rejected if any linked movement is already received.
     */
    @Transactional
    public void deletePendingBon(UUID bonId) {
        TransferBon bon = transferBonRepository.findById(bonId)
                .orElseThrow(() -> new RuntimeException("Transfer bon not found: " + bonId));

        boolean bonReceived = Boolean.TRUE.equals(bon.getStatusEntree()) || bon.getDateEntree() != null;
        if (bonReceived) {
            throw new RuntimeException("Cannot delete a delivered transfer bon");
        }

        long receivedMovements = rollMovementRepository.countByTransferBon_IdAndStatusEntreeTrue(bonId);
        if (receivedMovements > 0) {
            throw new RuntimeException("Cannot delete transfer bon: some movements are already received");
        }

        List<RollMovement> movements = rollMovementRepository.findByTransferBon_IdOrderByCreatedAtDesc(bonId);
        if (movements != null && !movements.isEmpty()) {
            rollMovementRepository.deleteAll(movements);
        }

        transferBonRepository.delete(bon);
        log.info("Deleted pending transfer bon {} (removed {} movements)", bonId, movements != null ? movements.size() : 0);
    }

    /**
     * Remove a roll movement from a transfer bon only if the bon is still pending (not received)
     * and the movement itself is not yet received.
     */
    @Transactional
    public void removePendingMovement(UUID bonId, UUID movementId) {
        TransferBon bon = transferBonRepository.findById(bonId)
                .orElseThrow(() -> new RuntimeException("Transfer bon not found: " + bonId));

        boolean bonReceived = Boolean.TRUE.equals(bon.getStatusEntree()) || bon.getDateEntree() != null;
        if (bonReceived) {
            throw new RuntimeException("Cannot remove movements from a delivered transfer bon");
        }

        RollMovement movement = rollMovementRepository.findById(movementId)
                .orElseThrow(() -> new RuntimeException("Movement not found: " + movementId));

        if (movement.getTransferBon() == null || movement.getTransferBon().getId() == null
                || !movement.getTransferBon().getId().equals(bonId)) {
            throw new RuntimeException("Movement does not belong to this transfer bon");
        }

        boolean movementReceived = Boolean.TRUE.equals(movement.getStatusEntree()) || movement.getDateEntree() != null;
        if (movementReceived) {
            throw new RuntimeException("Cannot remove a received movement");
        }

        rollMovementRepository.delete(movement);

        long remaining = rollMovementRepository.countByTransferBon_Id(bonId);
        log.info("Removed movement {} from pending transfer bon {} (remaining movements={})", movementId, bonId, remaining);
    }

    private String normalizeSearch(String value) {
        if (value == null) return "";
        String trimmed = value.trim();
        return trimmed.isEmpty() ? "" : trimmed.toLowerCase();
    }
}
