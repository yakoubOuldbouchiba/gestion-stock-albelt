package com.albelt.gestionstock.domain.placement.repository;

import com.albelt.gestionstock.domain.optimization.data.OptimizationOccupiedRectSnapshot;
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

    void deleteByCommandeItemId(UUID commandeItemId);

    @Query("""
            select pr from PlacedRectangle pr
            left join fetch pr.roll
            left join fetch pr.wastePiece
            left join fetch pr.color
            where pr.id = :id
            """)
    Optional<PlacedRectangle> findByIdWithSources(@Param("id") UUID id);

    @Query("""
            select pr from PlacedRectangle pr
            left join fetch pr.roll
            left join fetch pr.wastePiece
            left join fetch pr.color
            where pr.roll.id = :rollId
            order by pr.createdAt asc
            """)
    List<PlacedRectangle> findByRollIdWithSources(@Param("rollId") UUID rollId);

    @Query("""
            select pr from PlacedRectangle pr
            left join fetch pr.roll
            left join fetch pr.wastePiece
            left join fetch pr.color
            where pr.wastePiece.id = :wastePieceId
            order by pr.createdAt asc
            """)
    List<PlacedRectangle> findByWastePieceIdWithSources(@Param("wastePieceId") UUID wastePieceId);

    @Query("""
            select pr from PlacedRectangle pr
            left join fetch pr.roll
            left join fetch pr.wastePiece
            left join fetch pr.color
            where pr.commandeItemId = :commandeItemId
            order by pr.createdAt asc
            """)
    List<PlacedRectangle> findByCommandeItemIdWithSources(@Param("commandeItemId") UUID commandeItemId);

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
            and pr.commandeItemId in (
                select ci.id from CommandeItem ci
                join ci.commande c
                where c.id <> :commandeId
            )
            """)
    boolean existsOverlapExcludingCommande(
            @Param("rollId") UUID rollId,
            @Param("wastePieceId") UUID wastePieceId,
            @Param("xMin") int xMin,
            @Param("xMax") int xMax,
            @Param("yMin") int yMin,
            @Param("yMax") int yMax,
            @Param("commandeId") UUID commandeId
    );

    @Query("""
            select new com.albelt.gestionstock.domain.optimization.data.OptimizationOccupiedRectSnapshot(
                pr.roll.id,
                pr.wastePiece.id,
                pr.xMm,
                pr.yMm,
                pr.widthMm,
                pr.heightMm,
                pr.updatedAt
            )
            from PlacedRectangle pr
            where (:hasRollIds = true and pr.roll.id in :rollIds)
               or (:hasWasteIds = true and pr.wastePiece.id in :wasteIds)
            order by pr.createdAt asc
            """)
    List<OptimizationOccupiedRectSnapshot> findOccupiedSnapshotsBySourceIds(
            @Param("hasRollIds") boolean hasRollIds,
            @Param("rollIds") List<UUID> rollIds,
            @Param("hasWasteIds") boolean hasWasteIds,
            @Param("wasteIds") List<UUID> wasteIds
    );

}
