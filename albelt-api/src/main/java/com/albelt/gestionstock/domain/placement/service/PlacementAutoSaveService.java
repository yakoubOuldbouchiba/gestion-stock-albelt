package com.albelt.gestionstock.domain.placement.service;

import com.albelt.gestionstock.domain.placement.entity.PlacedRectangle;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Session;
import org.springframework.stereotype.Component;

import java.sql.PreparedStatement;
import java.sql.SQLException;
import java.sql.Savepoint;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Saves an auto-created PlacedRectangle using a JDBC savepoint within the caller's
 * transaction. If the DB overlap trigger fires, only the savepoint is rolled back;
 * the WastePiece already flushed in the same transaction is unaffected.
 */
@Component
@Slf4j
public class PlacementAutoSaveService {

    @PersistenceContext
    private EntityManager em;

    public boolean trySave(PlacedRectangle placement) {
        // Flush pending changes (WastePiece INSERT) before we touch the connection directly,
        // so Hibernate's batch queue is empty before we set the savepoint.
        em.flush();

        Session session = em.unwrap(Session.class);
        AtomicBoolean saved = new AtomicBoolean(false);

        session.doWork(conn -> {
            Savepoint sp = conn.setSavepoint("auto_placement");
            try {
                UUID id = UUID.randomUUID();
                LocalDateTime now = LocalDateTime.now();

                try (PreparedStatement ps = conn.prepareStatement(
                        "INSERT INTO placed_rectangles " +
                        "(id, roll_id, waste_piece_id, commande_item_id, color_id, " +
                        " x_mm, y_mm, width_mm, height_mm, created_at, updated_at) " +
                        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")) {

                    ps.setObject(1, id);
                    ps.setObject(2, placement.getRoll() != null ? placement.getRoll().getId() : null);
                    ps.setObject(3, placement.getWastePiece() != null ? placement.getWastePiece().getId() : null);
                    ps.setObject(4, placement.getCommandeItemId());
                    ps.setObject(5, placement.getColor() != null ? placement.getColor().getId() : null);
                    ps.setInt(6, placement.getXMm());
                    ps.setInt(7, placement.getYMm());
                    ps.setInt(8, placement.getWidthMm());
                    ps.setInt(9, placement.getHeightMm());
                    ps.setTimestamp(10, Timestamp.valueOf(now));
                    ps.setTimestamp(11, Timestamp.valueOf(now));
                    ps.executeUpdate();
                }

                conn.releaseSavepoint(sp);
                saved.set(true);

            } catch (SQLException e) {
                try { conn.rollback(sp); } catch (SQLException ignored) {}
                log.warn("Auto-placement skipped (overlap): roll={}, x={}, y={} — {}",
                        placement.getRoll() != null ? placement.getRoll().getId() : null,
                        placement.getXMm(), placement.getYMm(), e.getMessage());
            }
        });

        return saved.get();
    }
}
