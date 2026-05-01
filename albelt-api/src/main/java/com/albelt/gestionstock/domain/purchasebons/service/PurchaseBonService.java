package com.albelt.gestionstock.domain.purchasebons.service;

import com.albelt.gestionstock.domain.altier.entity.Altier;
import com.albelt.gestionstock.domain.altier.service.AltierService;
import com.albelt.gestionstock.domain.articles.service.ArticleService;
import com.albelt.gestionstock.domain.colors.entity.Color;
import com.albelt.gestionstock.domain.colors.service.ColorService;
import com.albelt.gestionstock.domain.purchasebons.dto.PurchaseBonItemRequest;
import com.albelt.gestionstock.domain.purchasebons.dto.PurchaseBonRequest;
import com.albelt.gestionstock.domain.purchasebons.dto.PurchaseBonResponse;
import com.albelt.gestionstock.domain.purchasebons.entity.PurchaseBon;
import com.albelt.gestionstock.domain.purchasebons.entity.PurchaseBonItem;
import com.albelt.gestionstock.domain.purchasebons.mapper.PurchaseBonMapper;
import com.albelt.gestionstock.domain.purchasebons.repository.PurchaseBonRepository;
import com.albelt.gestionstock.domain.rolls.dto.RollRequest;
import com.albelt.gestionstock.domain.rolls.service.RollService;
import com.albelt.gestionstock.domain.suppliers.entity.Supplier;
import com.albelt.gestionstock.domain.suppliers.service.SupplierService;
import com.albelt.gestionstock.domain.users.entity.User;
import com.albelt.gestionstock.domain.users.service.UserService;
import com.albelt.gestionstock.shared.enums.PurchaseBonStatus;
import com.albelt.gestionstock.shared.enums.RollStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for Purchase Bon (Bon d'achat) management.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PurchaseBonService {

    private final PurchaseBonRepository purchaseBonRepository;
    private final PurchaseBonMapper purchaseBonMapper;
    private final SupplierService supplierService;
    private final UserService userService;
    private final AltierService altierService;
    private final ColorService colorService;
    private final ArticleService articleService;
    private final RollService rollService;

    @Transactional
    public PurchaseBonResponse create(PurchaseBonRequest request, UUID createdById) {
        if (purchaseBonRepository.existsByReferenceIgnoreCase(request.getReference())) {
            throw new IllegalArgumentException("Purchase bon with reference '" + request.getReference() + "' already exists");
        }

        Supplier supplier = supplierService.getById(request.getSupplierId());
        User creator = userService.getById(createdById);

        PurchaseBon bon = PurchaseBon.builder()
                .reference(request.getReference())
                .bonDate(request.getBonDate())
                .supplier(supplier)
                .status(PurchaseBonStatus.DRAFT)
                .notes(request.getNotes())
                .createdBy(creator)
                .build();

        List<PurchaseBonItem> items = buildItems(bon, request.getItems());
        bon.getItems().addAll(items);

        PurchaseBon saved = purchaseBonRepository.save(bon);
        return purchaseBonMapper.toDetailsResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<PurchaseBonResponse> list() {
        return purchaseBonRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(purchaseBonMapper::toSummaryResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<PurchaseBonResponse> listPaged(com.albelt.gestionstock.shared.enums.PurchaseBonStatus status,
                                               UUID supplierId, java.time.LocalDate fromDate, java.time.LocalDate toDate,
                                               String search, int page, int size) {
        String normalizedSearch = normalize(search);
        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return purchaseBonRepository.findFiltered(status, supplierId, fromDate, toDate, normalizedSearch, pageable)
                .map(purchaseBonMapper::toSummaryResponse);
    }

    @Transactional(readOnly = true)
    public PurchaseBonResponse getDetails(UUID id) {
        PurchaseBon bon = purchaseBonRepository.findWithItemsById(id)
                .orElseThrow(() -> new RuntimeException("Purchase bon not found: " + id));
        return purchaseBonMapper.toDetailsResponse(bon);
    }

    @Transactional
    public PurchaseBonResponse update(UUID id, PurchaseBonRequest request) {
        PurchaseBon bon = purchaseBonRepository.findWithItemsById(id)
                .orElseThrow(() -> new RuntimeException("Purchase bon not found: " + id));

        if (bon.getStatus() != PurchaseBonStatus.DRAFT) {
            throw new RuntimeException("Only draft purchase bons can be updated");
        }

        if (request.getReference() != null && !request.getReference().equalsIgnoreCase(bon.getReference())) {
            if (purchaseBonRepository.existsByReferenceIgnoreCase(request.getReference())) {
                throw new IllegalArgumentException("Purchase bon with reference '" + request.getReference() + "' already exists");
            }
            bon.setReference(request.getReference());
        }
        if (request.getBonDate() != null) {
            bon.setBonDate(request.getBonDate());
        }
        if (request.getSupplierId() != null) {
            Supplier supplier = supplierService.getById(request.getSupplierId());
            bon.setSupplier(supplier);
        }
        bon.setNotes(request.getNotes());

        if (request.getItems() != null) {
            bon.getItems().clear();
            bon.getItems().addAll(buildItems(bon, request.getItems()));
        }

        PurchaseBon saved = purchaseBonRepository.save(bon);
        return purchaseBonMapper.toDetailsResponse(saved);
    }

    @Transactional
    public PurchaseBonResponse validate(UUID id, UUID validatedById) {
        PurchaseBon bon = purchaseBonRepository.findWithItemsById(id)
                .orElseThrow(() -> new RuntimeException("Purchase bon not found: " + id));

        if (bon.getStatus() == PurchaseBonStatus.VALIDATED) {
            throw new RuntimeException("Purchase bon already validated");
        }

        if (bon.getItems() == null || bon.getItems().isEmpty()) {
            throw new RuntimeException("Cannot validate purchase bon without items");
        }

        int createdCount = 0;
        for (PurchaseBonItem item : bon.getItems()) {
            int quantity = item.getQuantity() != null ? item.getQuantity() : 0;
            for (int i = 0; i < quantity; i++) {
                RollRequest rollRequest = RollRequest.builder()
                        .receivedDate(bon.getBonDate())
                        .supplierId(bon.getSupplier().getId())
                        .materialType(item.getMaterialType())
                        .nbPlis(item.getNbPlis())
                        .thicknessMm(item.getThicknessMm())
                        .widthMm(item.getWidthMm())
                        .widthRemainingMm(item.getWidthMm())
                        .lengthM(item.getLengthM())
                        .lengthRemainingM(item.getLengthM())
                        .areaM2(item.getAreaM2())
                        .status(RollStatus.AVAILABLE)
                        .altierId(item.getAltier() != null ? item.getAltier().getId() : null)
                        .qrCode(item.getQrCode())
                        .colorId(item.getColor() != null ? item.getColor().getId() : null)
                        .build();

                rollService.receive(rollRequest, validatedById);
                createdCount++;
            }
        }

        bon.setStatus(PurchaseBonStatus.VALIDATED);
        bon.setValidatedAt(LocalDateTime.now());
        PurchaseBon saved = purchaseBonRepository.save(bon);

        log.info("Validated purchase bon {} - created {} rolls", id, createdCount);
        return purchaseBonMapper.toDetailsResponse(saved);
    }

    @Transactional
    public void delete(UUID id) {
        PurchaseBon bon = purchaseBonRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Purchase bon not found: " + id));

        if (bon.getStatus() != PurchaseBonStatus.DRAFT) {
            throw new RuntimeException("Only draft purchase bons can be deleted");
        }

        purchaseBonRepository.delete(bon);
    }

    private List<PurchaseBonItem> buildItems(PurchaseBon bon, List<PurchaseBonItemRequest> requests) {
        List<PurchaseBonItem> items = new ArrayList<>();
        int lineNumber = 1;
        for (PurchaseBonItemRequest request : requests) {
            Altier altier = null;
            if (request.getAltierId() != null) {
                altier = altierService.getById(request.getAltierId());
            }

            Color color = null;
            if (request.getColorId() != null) {
                color = colorService.getById(request.getColorId());
            }

            PurchaseBonItem item = PurchaseBonItem.builder()
                    .purchaseBon(bon)
                    .lineNumber(lineNumber++)
                    .materialType(request.getMaterialType())
                    .nbPlis(request.getNbPlis())
                    .thicknessMm(request.getThicknessMm())
                    .widthMm(request.getWidthMm())
                    .lengthM(request.getLengthM())
                    .areaM2(request.getAreaM2())
                    .quantity(request.getQuantity())
                    .altier(altier)
                    .color(color)
                    .qrCode(request.getQrCode())
                    .build();
            item.setArticle(articleService.resolve(
                    request.getMaterialType(),
                    request.getThicknessMm(),
                    request.getNbPlis(),
                    request.getReference(),
                    request.getColorId()
            ));
            items.add(item);
        }
        return items;
    }

    private String normalize(String value) {
        if (value == null) return "";
        String trimmed = value.trim();
        return trimmed.isEmpty() ? "" : trimmed.toLowerCase();
    }
}
