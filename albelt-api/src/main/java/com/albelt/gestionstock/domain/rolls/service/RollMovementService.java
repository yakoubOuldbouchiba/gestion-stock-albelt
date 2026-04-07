package com.albelt.gestionstock.domain.rolls.service;

import com.albelt.gestionstock.domain.rolls.dto.RollMovementDTO;
import com.albelt.gestionstock.domain.rolls.entity.Roll;
import com.albelt.gestionstock.domain.rolls.entity.RollMovement;
import com.albelt.gestionstock.domain.rolls.entity.TransferBon;
import com.albelt.gestionstock.domain.rolls.mapper.RollMovementMapper;
import com.albelt.gestionstock.domain.rolls.repository.RollMovementRepository;
import com.albelt.gestionstock.domain.rolls.repository.TransferBonRepository;
import com.albelt.gestionstock.domain.waste.entity.WastePiece;
import com.albelt.gestionstock.domain.waste.service.WastePieceService;
import com.albelt.gestionstock.domain.altier.entity.Altier;
import com.albelt.gestionstock.domain.altier.service.AltierService;
import com.albelt.gestionstock.domain.users.entity.User;
import com.albelt.gestionstock.domain.users.service.UserService;
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
 * Service for managing roll movements between altiers (workshops)
 * Tracks location changes and integrates with TransferBon workflow
 * 
 * Core workflow:
 * 1. Create movement record (from and to altiers, dates)
 * 2. Link to optional TransferBon for batch operations  
 * 3. Update roll's altier location when movement is confirmed (dateEntree set)
 * 4. Maintain audit trail via operator and timestamps
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RollMovementService {

    private final RollMovementRepository rollMovementRepository;
    private final RollMovementMapper rollMovementMapper;
    private final RollService rollService;
    private final WastePieceService wastePieceService;
    private final AltierService altierService;
    private final UserService userService;
    private final TransferBonRepository transferBonRepository;

    /**
     * Record a new roll movement
     */
    @Transactional
    public RollMovementDTO recordMovement(
            UUID rollId,
            UUID wastePieceId,
            UUID fromAltierID,
            UUID toAltierID,
            LocalDateTime dateSortie,
            LocalDateTime dateEntree,
            String reason,
            UUID operatorId,
            String notes,
            UUID transferBonId
    ) {
        if ((rollId == null && wastePieceId == null) || (rollId != null && wastePieceId != null)) {
            throw new IllegalArgumentException("Provide exactly one of rollId or wastePieceId");
        }

        log.info("Recording movement for item {} from {} to {}",
                rollId != null ? rollId : wastePieceId, fromAltierID, toAltierID);

        if (fromAltierID == null || toAltierID == null) {
            throw new IllegalArgumentException("fromAltierID and toAltierID are required");
        }

        // Verify source exists
        Roll roll = null;
        WastePiece wastePiece = null;
        if (rollId != null) {
            roll = rollService.getById(rollId);
        }
        if (wastePieceId != null) {
            wastePiece = wastePieceService.getById(wastePieceId);
        }

        // Verify altiers exist
        Altier toAltier = altierService.getById(toAltierID);
        Altier fromAltier = altierService.getById(fromAltierID);  // Now required

        // Verify operator exists
        User operator = userService.getById(operatorId);

        // Optional transfer bon
        TransferBon transferBon = null;
        if (transferBonId != null) {
            transferBon = transferBonRepository.findById(transferBonId)
                    .orElseThrow(() -> new RuntimeException("Transfer bon not found: " + transferBonId));

            // Basic consistency check: bon from/to should match movement from/to
            if (transferBon.getFromAltier() != null && !transferBon.getFromAltier().getId().equals(fromAltierID)) {
                throw new RuntimeException("Movement fromAltier does not match transfer bon fromAltier");
            }
            if (transferBon.getToAltier() != null && !transferBon.getToAltier().getId().equals(toAltierID)) {
                throw new RuntimeException("Movement toAltier does not match transfer bon toAltier");
            }
        }

        // Create movement record
        RollMovement movement = RollMovement.builder()
                .roll(roll)
                .wastePiece(wastePiece)
                .fromAltier(fromAltier)
                .toAltier(toAltier)
                .dateSortie(dateSortie)
                .dateEntree(dateEntree)
                .statusSortie(dateSortie != null)  // Set to true if sortie date provided
                .statusEntree(dateEntree != null)  // Set to true if entree date provided
                .reason(reason)
                .operator(operator)
                .notes(notes)
            .transferBon(transferBon)
                .build();

        movement = rollMovementRepository.save(movement);

        // If movement belongs to a bon, mark bon sortie as done when at least one movement has sortie date
        if (transferBon != null && dateSortie != null) {
            if (transferBon.getStatusSortie() == null || !transferBon.getStatusSortie()) {
                transferBon.setStatusSortie(true);
            }
            if (transferBon.getDateSortie() == null) {
                transferBon.setDateSortie(dateSortie);
            }
            transferBonRepository.save(transferBon);
        }
        
        // Update item's altier to new location when entry is confirmed
        if (dateEntree != null && movement.getStatusEntree()) {
            updateSourceAltier(movement);
        }
        
        log.info("Movement recorded successfully: {}", movement.getId());

        return rollMovementMapper.toDTO(movement);
    }

    /**
     * Get all movements for a roll (history)
     */
    public List<RollMovementDTO> getRollMovementHistory(UUID rollId) {
        log.info("Fetching movement history for roll: {}", rollId);
        return rollMovementRepository.findByRollIdOrderByDateEntreeDesc(rollId)
                .stream()
                .map(rollMovementMapper::toDTO)
                .collect(Collectors.toList());
    }

    public Page<RollMovementDTO> getRollMovementHistoryPaged(UUID rollId, int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "dateEntree"));
        return rollMovementRepository.findByRollIdOrderByDateEntreeDesc(rollId, pageable)
                .map(rollMovementMapper::toDTO);
    }

    /**
     * Get all movements for a waste piece (history)
     */
    public List<RollMovementDTO> getWastePieceMovementHistory(UUID wastePieceId) {
        log.info("Fetching movement history for waste piece: {}", wastePieceId);
        return rollMovementRepository.findByWastePieceIdOrderByDateEntreeDesc(wastePieceId)
                .stream()
                .map(rollMovementMapper::toDTO)
                .collect(Collectors.toList());
    }

    public Page<RollMovementDTO> getWastePieceMovementHistoryPaged(UUID wastePieceId, int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "dateEntree"));
        return rollMovementRepository.findByWastePieceIdOrderByDateEntreeDesc(wastePieceId, pageable)
                .map(rollMovementMapper::toDTO);
    }

    /**
     * Get current location of a roll (latest movement)
     */
    public RollMovementDTO getCurrentLocation(UUID rollId) {
        RollMovement movement = rollMovementRepository.findLatestMovementByRollId(rollId);
        return movement != null ? rollMovementMapper.toDTO(movement) : null;
    }

    /**
     * Get current location of a waste piece (latest movement)
     */
    public RollMovementDTO getCurrentWastePieceLocation(UUID wastePieceId) {
        RollMovement movement = rollMovementRepository.findLatestMovementByWastePieceId(wastePieceId);
        return movement != null ? rollMovementMapper.toDTO(movement) : null;
    }

    /**
     * Get all movements to a specific altier
     */
    public List<RollMovementDTO> getMovementsToAltier(UUID altierID) {
        return rollMovementRepository.findByToAltierIdOrderByDateEntreeDesc(altierID)
                .stream()
                .map(rollMovementMapper::toDTO)
                .collect(Collectors.toList());
    }

    public Page<RollMovementDTO> getMovementsToAltierPaged(UUID altierID, int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "dateEntree"));
        return rollMovementRepository.findByToAltierIdOrderByDateEntreeDesc(altierID, pageable)
                .map(rollMovementMapper::toDTO);
    }

    /**
     * Get all movements from a specific altier
     */
    public List<RollMovementDTO> getMovementsFromAltier(UUID altierID) {
        return rollMovementRepository.findByFromAltierIdOrderByDateSortieDesc(altierID)
                .stream()
                .map(rollMovementMapper::toDTO)
                .collect(Collectors.toList());
    }

    public Page<RollMovementDTO> getMovementsFromAltierPaged(UUID altierID, int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "dateSortie"));
        return rollMovementRepository.findByFromAltierIdOrderByDateSortieDesc(altierID, pageable)
                .map(rollMovementMapper::toDTO);
    }

    /**
     * Get movements recorded by an operator
     */
    public List<RollMovementDTO> getOperatorMovements(UUID operatorId) {
        return rollMovementRepository.findByOperatorIdOrderByCreatedAtDesc(operatorId)
                .stream()
                .map(rollMovementMapper::toDTO)
                .collect(Collectors.toList());
    }

    public Page<RollMovementDTO> getOperatorMovementsPaged(UUID operatorId, int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return rollMovementRepository.findByOperatorIdOrderByCreatedAtDesc(operatorId, pageable)
                .map(rollMovementMapper::toDTO);
    }

    /**
     * Update movement record
     */
    @Transactional
    public RollMovementDTO updateMovement(UUID movementId, RollMovementDTO dto) {
        RollMovement movement = rollMovementRepository.findById(movementId)
                .orElseThrow(() -> new RuntimeException("Movement not found: " + movementId));

        if (dto.getDateSortie() != null) {
            movement.setDateSortie(dto.getDateSortie());
        }
        if (dto.getDateEntree() != null) {
            movement.setDateEntree(dto.getDateEntree());
        }
        if (dto.getReason() != null) {
            movement.setReason(dto.getReason());
        }
        if (dto.getNotes() != null) {
            movement.setNotes(dto.getNotes());
        }

        movement = rollMovementRepository.save(movement);
        return rollMovementMapper.toDTO(movement);
    }

    /**
     * Confirm receipt of a movement (set entry date and update roll location)
     */
    @Transactional
    public RollMovementDTO confirmReceipt(UUID movementId, LocalDateTime dateEntree) {
        log.info("Confirming receipt for movement: {}", movementId);

        RollMovement movement = rollMovementRepository.findById(movementId)
                .orElseThrow(() -> new RuntimeException("Movement not found: " + movementId));

        // Update movement with entry date and status
        movement.setDateEntree(dateEntree);
        movement.setStatusEntree(true);
        movement = rollMovementRepository.save(movement);

        // Update item's current altier to destination altier
        updateSourceAltier(movement);

        // If movement belongs to a transfer bon, auto-complete the bon when all movements are received
        if (movement.getTransferBon() != null) {
            UUID bonId = movement.getTransferBon().getId();
            long total = rollMovementRepository.countByTransferBon_Id(bonId);
            long received = rollMovementRepository.countByTransferBon_IdAndStatusEntreeTrue(bonId);
            if (total > 0 && total == received) {
                TransferBon bon = transferBonRepository.findById(bonId)
                        .orElseThrow(() -> new RuntimeException("Transfer bon not found: " + bonId));
                bon.setStatusEntree(true);
                if (bon.getDateEntree() == null) {
                    bon.setDateEntree(dateEntree);
                }
                transferBonRepository.save(bon);
            }
        }
        
        String sourceId = movement.getRoll() != null
            ? movement.getRoll().getId().toString()
            : movement.getWastePiece() != null
                ? movement.getWastePiece().getId().toString()
                : "N/A";
        log.info("Receipt confirmed for movement {}, source {} now at altier {}",
            movementId, sourceId, movement.getToAltier().getId());

        return rollMovementMapper.toDTO(movement);
    }

    /**
     * Get pending receipts for a specific altier (movements without entry date)
     */
    public List<RollMovementDTO> getPendingReceiptsByAltier(UUID altierID) {
        log.info("Fetching pending receipts for altier: {}", altierID);
        return rollMovementRepository.findPendingReceiptsByAltier(altierID)
                .stream()
                .map(rollMovementMapper::toDTO)
                .collect(Collectors.toList());
    }

    public Page<RollMovementDTO> getPendingReceiptsByAltierPaged(UUID altierID, int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "dateSortie"));
        return rollMovementRepository.findPendingReceiptsByAltier(altierID, pageable)
                .map(rollMovementMapper::toDTO);
    }

    /**
     * Get all pending receipts (movements without entry date)
     */
    public List<RollMovementDTO> getAllPendingReceipts() {
        log.info("Fetching all pending receipts");
        return rollMovementRepository.findAllPendingReceipts()
                .stream()
                .map(rollMovementMapper::toDTO)
                .collect(Collectors.toList());
    }

    public Page<RollMovementDTO> getAllPendingReceiptsPaged(int page, int size) {
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "dateSortie"));
        return rollMovementRepository.findAllPendingReceipts(pageable)
                .map(rollMovementMapper::toDTO);
    }

    /**
     * Delete movement record
     */
    @Transactional
    public void deleteMovement(UUID movementId) {
        rollMovementRepository.deleteById(movementId);
        log.info("Movement deleted: {}", movementId);
    }

    private void updateSourceAltier(RollMovement movement) {
        if (movement.getRoll() != null) {
            Roll roll = movement.getRoll();
            roll.setAltier(movement.getToAltier());
            rollService.save(roll);
            log.info("Updated roll {} location to altier {}", roll.getId(), movement.getToAltier().getId());
        }
        if (movement.getWastePiece() != null) {
            WastePiece wastePiece = movement.getWastePiece();
            wastePiece.setAltier(movement.getToAltier());
            wastePieceService.save(wastePiece);
            log.info("Updated waste piece {} location to altier {}", wastePiece.getId(), movement.getToAltier().getId());
        }
    }
}
