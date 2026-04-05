package com.albelt.gestionstock.domain.placement.repository;

import com.albelt.gestionstock.domain.placement.entity.PlacedRectangle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PlacedRectangleRepository extends JpaRepository<PlacedRectangle, UUID> {

    long countByRollId(UUID rollId);
    long countByWastePieceId(UUID wastePieceId);

    List<PlacedRectangle> findByRollIdOrderByCreatedAtAsc(UUID rollId);
    List<PlacedRectangle> findByWastePieceIdOrderByCreatedAtAsc(UUID wastePieceId);
    List<PlacedRectangle> findByCommandeItemIdOrderByCreatedAtAsc(UUID commandeItemId);

    Optional<PlacedRectangle> findFirstByCommandeItemIdAndColorIsNotNullOrderByCreatedAtAsc(UUID commandeItemId);
    Optional<PlacedRectangle> findFirstByRollIdAndCommandeItemIdIsNullAndColorIsNotNullOrderByCreatedAtAsc(UUID rollId);
    Optional<PlacedRectangle> findFirstByWastePieceIdAndCommandeItemIdIsNullAndColorIsNotNullOrderByCreatedAtAsc(UUID wastePieceId);

    long deleteByRollId(UUID rollId);
    long deleteByWastePieceId(UUID wastePieceId);

    @Query("""
        select case when count(pr) > 0 then true else false end
        from PlacedRectangle pr
        where (
            (:rollId is not null and pr.roll.id = :rollId)
            or (:wastePieceId is not null and pr.wastePiece.id = :wastePieceId)
        )
        and pr.xMm < :xMax
        and (pr.xMm + pr.widthMm) > :xMin
        and pr.yMm < :yMax
        and (pr.yMm + pr.heightMm) > :yMin
        and (:excludeId is null or pr.id <> :excludeId)
        """)
    boolean existsOverlap(
            @Param("rollId") UUID rollId,
            @Param("wastePieceId") UUID wastePieceId,
            @Param("xMin") int xMin,
            @Param("xMax") int xMax,
            @Param("yMin") int yMin,
            @Param("yMax") int yMax,
            @Param("excludeId") UUID excludeId
    );
}
