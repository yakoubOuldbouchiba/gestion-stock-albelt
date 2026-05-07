package com.albelt.gestionstock.domain.admin.repository;

import com.albelt.gestionstock.domain.admin.entity.AuditLog;
import com.albelt.gestionstock.shared.enums.AuditAction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    @Query("""
            SELECT a FROM AuditLog a
            WHERE (:actorId       IS NULL OR a.actorId      = :actorId)
              AND (:action        IS NULL OR a.action       = :action)
              AND (:targetEntity  IS NULL OR a.targetEntity = :targetEntity)
              AND (:targetId      IS NULL OR a.targetId     = :targetId)
              AND (a.timestamp   >= :fromDate)
              AND (a.timestamp   <= :toDate)
            ORDER BY a.timestamp DESC
            """)
    Page<AuditLog> findFiltered(
            @Param("actorId")      UUID actorId,
            @Param("action")       AuditAction action,
            @Param("targetEntity") String targetEntity,
            @Param("targetId")     String targetId,
            @Param("fromDate")     LocalDateTime fromDate,
            @Param("toDate")       LocalDateTime toDate,
            Pageable pageable
    );
}
