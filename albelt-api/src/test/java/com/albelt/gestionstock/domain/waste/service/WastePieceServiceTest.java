package com.albelt.gestionstock.domain.waste.service;

import com.albelt.gestionstock.domain.altier.service.AltierService;
import com.albelt.gestionstock.domain.articles.service.ArticleService;
import com.albelt.gestionstock.domain.colors.service.ColorService;
import com.albelt.gestionstock.domain.commandes.repository.CommandeItemRepository;
import com.albelt.gestionstock.domain.placement.repository.PlacedRectangleRepository;
import com.albelt.gestionstock.domain.placement.service.PlacementAutoSaveService;
import com.albelt.gestionstock.domain.rolls.repository.RollRepository;
import com.albelt.gestionstock.domain.waste.repository.WastePieceRepository;
import com.albelt.gestionstock.shared.enums.WasteStatus;
import com.albelt.gestionstock.shared.persistence.LotIdAllocator;
import com.albelt.gestionstock.shared.utils.QrCodeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WastePieceServiceTest {

    @Mock
    private WastePieceRepository wastePieceRepository;
    @Mock
    private RollRepository rollRepository;
    @Mock
    private PlacedRectangleRepository placedRectangleRepository;
    @Mock
    private com.albelt.gestionstock.domain.waste.mapper.WastePieceMapper wastePieceMapper;
    @Mock
    private ColorService colorService;
    @Mock
    private AltierService altierService;
    @Mock
    private ArticleService articleService;
    @Mock
    private CommandeItemRepository commandeItemRepository;
    @Mock
    private LotIdAllocator lotIdAllocator;
    @Mock
    private QrCodeService qrCodeService;
    @Mock
    private PlacementAutoSaveService placementAutoSaveService;

    private WastePieceService service;

    @BeforeEach
    void setUp() {
        service = new WastePieceService(
                wastePieceRepository,
                rollRepository,
                placedRectangleRepository,
                wastePieceMapper,
                colorService,
                altierService,
                articleService,
                commandeItemRepository,
                lotIdAllocator,
                qrCodeService,
                placementAutoSaveService
        );
    }

    @Test
    void getAvailableByUserAltiersUsesAltierScopedQueryForRestrictedUsers() {
        UUID altierId = UUID.randomUUID();

        service.getAvailableByUserAltiers(false, List.of(altierId), 0, 20);

        verify(wastePieceRepository).findAvailableByAltierIds(eq(List.of(altierId)), eq(List.of(WasteStatus.AVAILABLE, WasteStatus.OPENED)), any(Pageable.class));
        verify(wastePieceRepository, never()).findAvailable(any(), any(Pageable.class));
    }

    @Test
    void getAvailableByArticleUsesAltierScopedQueryForRestrictedUsers() {
        UUID altierId = UUID.randomUUID();
        UUID articleId = UUID.randomUUID();

        service.getAvailableByArticle(false, List.of(altierId), articleId, 0, 20);

        verify(wastePieceRepository).findAvailableByAltierIdsAndArticle(eq(List.of(altierId)), eq(articleId), eq(List.of(WasteStatus.AVAILABLE, WasteStatus.OPENED)), any(Pageable.class));
        verify(wastePieceRepository, never()).findAvailableByArticle(any(), any(), any(Pageable.class));
    }

    @Test
    void getAvailableByUserAltiersReturnsEmptyWhenRestrictedUserHasNoAltiers() {
        var result = service.getAvailableByUserAltiers(false, List.of(), 0, 20);

        assertTrue(result.isEmpty());
        verifyNoInteractions(wastePieceRepository);
    }
}
