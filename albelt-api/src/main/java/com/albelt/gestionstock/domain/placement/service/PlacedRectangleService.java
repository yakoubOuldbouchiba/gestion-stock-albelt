package com.albelt.gestionstock.domain.placement.service;

import com.albelt.gestionstock.domain.colors.entity.Color;
import com.albelt.gestionstock.domain.colors.service.ColorService;
import com.albelt.gestionstock.domain.commandes.entity.CommandeItem;
import com.albelt.gestionstock.domain.commandes.repository.CommandeItemRepository;
import com.albelt.gestionstock.domain.placement.dto.PlacedRectangleRequest;
import com.albelt.gestionstock.domain.placement.entity.PlacedRectangle;
import com.albelt.gestionstock.domain.placement.mapper.PlacedRectangleMapper;
import com.albelt.gestionstock.domain.placement.repository.PlacedRectangleRepository;
import com.albelt.gestionstock.domain.rolls.entity.Roll;
import com.albelt.gestionstock.domain.rolls.repository.RollRepository;
import com.albelt.gestionstock.domain.waste.entity.WastePiece;
import com.albelt.gestionstock.domain.waste.repository.WastePieceRepository;
import com.albelt.gestionstock.shared.enums.RollStatus;
import com.albelt.gestionstock.shared.enums.WasteStatus;
import com.albelt.gestionstock.shared.exceptions.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class PlacedRectangleService {

    private final PlacedRectangleRepository placedRectangleRepository;
    private final PlacedRectangleMapper placedRectangleMapper;
    private final RollRepository rollRepository;
    private final WastePieceRepository wastePieceRepository;
    private final CommandeItemRepository commandeItemRepository;
    private final ColorService colorService;

    public PlacedRectangle create(PlacedRectangleRequest request) {
        validateSource(request.getRollId(), request.getWastePieceId());

        Roll roll = getRollIfPresent(request.getRollId());
        WastePiece wastePiece = getWastePieceIfPresent(request.getWastePieceId());
        CommandeItem commandeItem = getCommandeItemIfPresent(request.getCommandeItemId());

        Integer parentWidthMm = roll != null ? roll.getWidthMm() : wastePiece != null ? wastePiece.getWidthMm() : null;
        BigDecimal parentLengthM = roll != null ? roll.getLengthM() : wastePiece != null ? wastePiece.getLengthM() : null;
        validateBounds(request, parentWidthMm, parentLengthM);
        validateOverlap(request, roll, wastePiece, null);

        Color color = resolveColor(request, commandeItem, roll, wastePiece);

        boolean firstPlacement = roll != null
                ? placedRectangleRepository.countByRollId(roll.getId()) == 0
                : placedRectangleRepository.countByWastePieceId(wastePiece.getId()) == 0;

        PlacedRectangle placedRectangle = placedRectangleMapper.toEntity(request, roll, wastePiece, color);
        PlacedRectangle saved = placedRectangleRepository.save(placedRectangle);

        if (firstPlacement) {
            updateSourceStatusOnFirstPlacement(roll, wastePiece);
        }

        return saved;
    }

    @Transactional(readOnly = true)
    public PlacedRectangle getById(UUID id) {
        return placedRectangleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Placed rectangle not found: " + id));
    }

    @Transactional(readOnly = true)
    public List<PlacedRectangle> getByRollId(UUID rollId) {
        return placedRectangleRepository.findByRollIdOrderByCreatedAtAsc(rollId);
    }

    @Transactional(readOnly = true)
    public List<PlacedRectangle> getByWastePieceId(UUID wastePieceId) {
        return placedRectangleRepository.findByWastePieceIdOrderByCreatedAtAsc(wastePieceId);
    }

    @Transactional(readOnly = true)
    public List<PlacedRectangle> getByCommandeItemId(UUID commandeItemId) {
        return placedRectangleRepository.findByCommandeItemIdOrderByCreatedAtAsc(commandeItemId);
    }

    public PlacedRectangle update(UUID id, PlacedRectangleRequest request) {
        PlacedRectangle existing = getById(id);
        Roll roll = existing.getRoll();
        WastePiece wastePiece = existing.getWastePiece();

        if (request.getRollId() != null && (roll == null || !roll.getId().equals(request.getRollId()))) {
            throw new IllegalArgumentException("Placement source cannot be changed");
        }
        if (request.getWastePieceId() != null && (wastePiece == null || !wastePiece.getId().equals(request.getWastePieceId()))) {
            throw new IllegalArgumentException("Placement source cannot be changed");
        }

        Integer parentWidthMm = roll != null ? roll.getWidthMm() : wastePiece != null ? wastePiece.getWidthMm() : null;
        BigDecimal parentLengthM = roll != null ? roll.getLengthM() : wastePiece != null ? wastePiece.getLengthM() : null;
        validateBounds(request, parentWidthMm, parentLengthM);
        validateOverlap(request, roll, wastePiece, existing.getId());

        existing.setXMm(request.getXMm());
        existing.setYMm(request.getYMm());
        existing.setWidthMm(request.getWidthMm());
        existing.setHeightMm(request.getHeightMm());

        return placedRectangleRepository.save(existing);
    }

    public void delete(UUID id) {
        PlacedRectangle existing = getById(id);
        placedRectangleRepository.delete(existing);
    }

    public long clearByRollId(UUID rollId) {
        return placedRectangleRepository.deleteByRollId(rollId);
    }

    public long clearByWastePieceId(UUID wastePieceId) {
        return placedRectangleRepository.deleteByWastePieceId(wastePieceId);
    }

    private void validateSource(UUID rollId, UUID wastePieceId) {
        if ((rollId == null && wastePieceId == null) || (rollId != null && wastePieceId != null)) {
            throw new IllegalArgumentException("Specify exactly one of rollId or wastePieceId");
        }
    }

    private Roll getRollIfPresent(UUID rollId) {
        if (rollId == null) {
            return null;
        }
        return rollRepository.findById(rollId)
                .orElseThrow(() -> ResourceNotFoundException.roll(rollId.toString()));
    }

    private WastePiece getWastePieceIfPresent(UUID wastePieceId) {
        if (wastePieceId == null) {
            return null;
        }
        return wastePieceRepository.findById(wastePieceId)
                .orElseThrow(() -> new ResourceNotFoundException("Waste piece not found: " + wastePieceId));
    }

    private CommandeItem getCommandeItemIfPresent(UUID commandeItemId) {
        if (commandeItemId == null) {
            return null;
        }
        return commandeItemRepository.findById(commandeItemId)
                .orElseThrow(() -> new ResourceNotFoundException("Order item not found: " + commandeItemId));
    }

    private void validateBounds(PlacedRectangleRequest request, Integer parentWidthMm, BigDecimal parentLengthM) {
        if (parentWidthMm == null || parentLengthM == null) {
            throw new IllegalArgumentException("Source dimensions are required for placement validation");
        }

        BigDecimal maxLengthMm = parentLengthM.multiply(BigDecimal.valueOf(1000));
        BigDecimal x = BigDecimal.valueOf(request.getXMm());
        BigDecimal y = BigDecimal.valueOf(request.getYMm());
        BigDecimal width = BigDecimal.valueOf(request.getWidthMm());
        BigDecimal height = BigDecimal.valueOf(request.getHeightMm());

        if (x.compareTo(BigDecimal.valueOf(parentWidthMm)) >= 0) {
            throw new IllegalArgumentException("x must be < source width");
        }
        if (y.compareTo(maxLengthMm) >= 0) {
            throw new IllegalArgumentException("y must be < source length");
        }
        if (x.add(width).compareTo(BigDecimal.valueOf(parentWidthMm)) > 0) {
            throw new IllegalArgumentException("x + width must be <= source width");
        }
        if (y.add(height).compareTo(maxLengthMm) > 0) {
            throw new IllegalArgumentException("y + height must be <= source length");
        }
    }

    private void validateOverlap(PlacedRectangleRequest request, Roll roll, WastePiece wastePiece, UUID excludeId) {
        int xMin = request.getXMm();
        int yMin = request.getYMm();
        int xMax = xMin + request.getWidthMm();
        int yMax = yMin + request.getHeightMm();
        UUID rollId = roll != null ? roll.getId() : null;
        UUID wastePieceId = wastePiece != null ? wastePiece.getId() : null;
        boolean overlaps = placedRectangleRepository.existsOverlap(
                rollId,
                wastePieceId,
                xMin,
                xMax,
                yMin,
                yMax,
                excludeId
        );
        if (overlaps) {
            throw new IllegalArgumentException("Placement overlaps an existing rectangle");
        }
    }

    private Color resolveColor(PlacedRectangleRequest request, CommandeItem commandeItem, Roll roll, WastePiece wastePiece) {
        UUID requestedColorId = request.getColorId();

        if (commandeItem != null) {
            Color itemColor = commandeItem.getColor();
            if (itemColor != null) {
                if (requestedColorId != null && !itemColor.getId().equals(requestedColorId)) {
                    throw new IllegalArgumentException("Placed rectangle color must match commande item color");
                }
                ensureColorMatchesExisting(itemColor.getId(), placedRectangleRepository
                        .findFirstByCommandeItemIdAndColorIsNotNullOrderByCreatedAtAsc(commandeItem.getId()),
                        "commande item");
                return itemColor;
            }

            if (requestedColorId != null) {
                Color requested = colorService.getById(requestedColorId);
                ensureColorMatchesExisting(requested.getId(), placedRectangleRepository
                        .findFirstByCommandeItemIdAndColorIsNotNullOrderByCreatedAtAsc(commandeItem.getId()),
                        "commande item");
                return requested;
            }

            Optional<PlacedRectangle> existing = placedRectangleRepository
                    .findFirstByCommandeItemIdAndColorIsNotNullOrderByCreatedAtAsc(commandeItem.getId());
            return existing.map(PlacedRectangle::getColor).orElse(null);
        }

        Color sourceColor = roll != null ? roll.getColor() : wastePiece != null ? wastePiece.getColor() : null;
        Optional<PlacedRectangle> existingForSource = roll != null
                ? placedRectangleRepository.findFirstByRollIdAndCommandeItemIdIsNullAndColorIsNotNullOrderByCreatedAtAsc(roll.getId())
                : placedRectangleRepository.findFirstByWastePieceIdAndCommandeItemIdIsNullAndColorIsNotNullOrderByCreatedAtAsc(wastePiece.getId());

        if (sourceColor != null) {
            if (requestedColorId != null && !sourceColor.getId().equals(requestedColorId)) {
                throw new IllegalArgumentException("Placed rectangle color must match source color");
            }
            ensureColorMatchesExisting(sourceColor.getId(), existingForSource, "source");
            return sourceColor;
        }

        if (requestedColorId != null) {
            Color requested = colorService.getById(requestedColorId);
            ensureColorMatchesExisting(requested.getId(), existingForSource, "source");
            return requested;
        }

        return existingForSource.map(PlacedRectangle::getColor).orElse(null);
    }

    private void ensureColorMatchesExisting(UUID newColorId, Optional<PlacedRectangle> existing, String scope) {
        if (existing.isEmpty()) {
            return;
        }
        UUID existingColorId = existing.get().getColor() != null ? existing.get().getColor().getId() : null;
            if (!java.util.Objects.equals(existingColorId, newColorId)) {
                throw new IllegalArgumentException("Placed rectangle color must match existing " + scope + " color");
            }
    }

    private void updateSourceStatusOnFirstPlacement(Roll roll, WastePiece wastePiece) {
        if (roll != null && !RollStatus.EXHAUSTED.equals(roll.getStatus())) {
            roll.setStatus(RollStatus.EXHAUSTED);
            rollRepository.save(roll);
            return;
        }
        if (wastePiece != null && !WasteStatus.EXHAUSTED.equals(wastePiece.getStatus())) {
            wastePiece.setStatus(WasteStatus.EXHAUSTED);
            wastePieceRepository.save(wastePiece);
        }
    }
}
