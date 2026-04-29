package com.albelt.gestionstock.shared.persistence;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
public class LotIdAllocator {

    private static final long LOT_ID_LOCK_KEY = 742_001L;

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional(propagation = Propagation.MANDATORY)
    public int nextLotId() {
        entityManager.createNativeQuery("select pg_advisory_xact_lock(:lockKey)")
                .setParameter("lockKey", LOT_ID_LOCK_KEY)
                .getSingleResult();

        Number currentMax = (Number) entityManager.createNativeQuery("""
                select greatest(
                    coalesce((select max(r.lot_id) from rolls r), 0),
                    coalesce((select max(wp.lot_id) from waste_pieces wp), 0)
                )
                """)
                .getSingleResult();

        return currentMax.intValue() + 1;
    }
}
