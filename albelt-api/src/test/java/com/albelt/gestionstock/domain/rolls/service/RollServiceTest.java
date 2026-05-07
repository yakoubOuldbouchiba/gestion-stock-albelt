package com.albelt.gestionstock.domain.rolls.service;

import com.albelt.gestionstock.domain.altier.service.AltierService;
import com.albelt.gestionstock.domain.articles.service.ArticleService;
import com.albelt.gestionstock.domain.rolls.repository.RollRepository;
import com.albelt.gestionstock.domain.suppliers.service.SupplierService;
import com.albelt.gestionstock.shared.enums.RollStatus;
import com.albelt.gestionstock.shared.persistence.LotIdAllocator;
import com.albelt.gestionstock.shared.utils.QrCodeService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class RollServiceTest {

    @Mock
    private RollRepository rollRepository;
    @Mock
    private com.albelt.gestionstock.domain.rolls.mapper.RollMapper rollMapper;
    @Mock
    private SupplierService supplierService;
    @Mock
    private AltierService altierService;
    @Mock
    private ArticleService articleService;
    @Mock
    private LotIdAllocator lotIdAllocator;
    @Mock
    private QrCodeService qrCodeService;

    private RollService service;

    @BeforeEach
    void setUp() {
        service = new RollService(
                rollRepository,
                rollMapper,
                supplierService,
                altierService,
                articleService,
                lotIdAllocator,
                qrCodeService
        );
    }

    @Test
    void getAvailableByUserAltiersUsesGlobalQueryForUnrestrictedUsers() {
        service.getAvailableByUserAltiers(true, List.of());

        verify(rollRepository).findAvailable(eq(List.of(RollStatus.AVAILABLE, RollStatus.OPENED)));
        verify(rollRepository, never()).findAvailableByAltierIds(any(), any());
    }

    @Test
    void getAvailableByUserAltiersAndArticleUsesGlobalArticleQueryForUnrestrictedUsers() {
        UUID articleId = UUID.randomUUID();

        service.getAvailableByUserAltiersAndArticle(true, List.of(), articleId);

        verify(rollRepository).findAvailableByArticle(eq(articleId), eq(List.of(RollStatus.AVAILABLE, RollStatus.OPENED)));
        verify(rollRepository, never()).findAvailableByAltierIdsAndArticle(any(), any(), any());
    }
}
