# SERVICE LAYER IMPLEMENTATION GUIDE
**Date**: March 27, 2026  
**Phase**: 2 - API Endpoints & Service Enhancements

> **Status**: Read this guide to implement the cutting workflow in the service layer

---

## OVERVIEW

The service layer needs enhancements to support the integrated cutting workflow where:
1. Cutting operations are linked to order items (Commandes)
2. Waste is generated and classified automatically
3. Roll dimensions update after each cut
4. Order items are marked complete when fulfilled

---

## KEY ENHANCEMENTS BY SERVICE

### 1. CuttingOperationService

#### NEW METHOD: `completeCuttingWithWaste()`
```java
/**
 * Complete a cutting operation with automatic:
 * - Waste piece generation
 * - Roll state update
 * - Order item completion
 * - Status tracking
 */
public CuttingOperationCompleteResponse completeCuttingWithWaste(
    UUID operationId,
    CuttingOperationCompleteRequest request
) {
    // 1. Load cutting operation
    CuttingOperation operation = getById(operationId);
    
    // 2. Validate status is PREPARED or IN_PROGRESS
    if (!isValidForCompletion(operation.getStatus())) {
        throw new InvalidOperationStatusException(...);
    }
    
    // 3. Update cutting operation
    operation.setStatus("COMPLETED");
    operation.setFinalWasteAreaM2(request.getWasteAreaM2());
    operation.save();
    
    // 4. Create waste pieces (if wasteArea > 0)
    if (request.getWasteAreaM2() > 0) {
        wastePieceService.createFromCuttingOperation(
            operation,
            request.getWasteClassification()
        );
    }
    
    // 5. Update roll tracking
    rollService.recordCuttingOperation(
        operation.getRoll().getId(),
        request.getConsumedLength(),
        request.getWasteAreaM2()
    );
    
    // 6. Update order item if linked
    if (operation.getCommandeItemId() != null) {
        commandeItemService.updateWithCuttingCompletion(
            operation.getCommandeItemId(),
            operation.getId(),
            request.getActualPiecesCut(),
            request.getActualSurfaceCutM2()
        );
    }
    
    // 7. Return response
    return toCompleteResponse(operation, wastes);
}
```

#### NEW METHOD: `updateStatus()`
```java
/**
 * Update cutting operation status in workflow
 * PREPARED -> IN_PROGRESS -> COMPLETED
 * Can transition to ON_HOLD or CANCELLED
 */
public CuttingOperation updateStatus(
    UUID operationId,
    String newStatus
) {
    CuttingOperation operation = getById(operationId);
    
    // Validate status transition
    if (!isValidStatusTransition(operation.getStatus(), newStatus)) {
        throw new InvalidStatusTransitionException(...);
    }
    
    operation.setStatus(newStatus);
    return save(operation);
}
```

#### NEW METHOD: `getOperationsByCommandeItem()`
```java
/**
 * Get all cutting operations for a specific order item
 * Useful for tracking fulfillment
 */
public List<CuttingOperation> getOperationsByCommandeItem(UUID commandeItemId) {
    return repository.findByCommandeItemId(commandeItemId);
}
```

---

### 2. WastePieceService

#### NEW METHOD: `createFromCuttingOperation()`
```java
/**
 * Generate waste pieces from a completed cutting operation
 * Automatically classifies based on area size
 */
public List<WastePiece> createFromCuttingOperation(
    CuttingOperation operation,
    CreateWasteRequest request
) {
    List<WastePiece> wastes = new ArrayList<>();
    
    // Parse waste dimensions from nesting result
    List<WasteDimension> wasteDimensions = 
        parseNestingWaste(operation.getNestingResult());
    
    for (WasteDimension waste : wasteDimensions) {
        WastePiece piece = WastePiece.builder()
            .fromCuttingOperation(operation)
            .roll(operation.getRoll())  // Link to source roll
            .materialType(operation.getRoll().getMaterialType())
            .widthMm(waste.getWidthMm())
            .lengthM(waste.getLengthM())
            .quantityPieces(1)
            .wasteType(classifyWaste(waste)) // DECHET or REUSABLE
            .classificationDate(LocalDateTime.now())
            .status(WasteStatus.AVAILABLE)
            .build();
        
        wastes.add(repository.save(piece));
        log.info("Created waste piece: id={}, wasteType={}", piece.getId(), piece.getWasteType());
    }
    
    // Audit log
    auditLog.log("WASTE_CREATED", operation.getId(), wastes.size() + " pieces");
    
    return wastes;
}

// Helper method
private String classifyWaste(WasteDimension waste) {
    BigDecimal area = DECM.BIG(waste.getWidthMm()).divide(1000)
        .multiply(waste.getLengthM());
    
    if (area.compareTo(BigDecimal.valueOf(3.0)) >= 0) {
        return "REUSABLE"; // >= 3m²
    }
    return "DECHET"; // < 3m²
}
```

#### NEW METHOD: `classifyWaste()`
```java
/**
 * Change waste classification between DECHET and REUSABLE
 * Tracks changes in history table
 */
public WastePiece classifyWaste(
    UUID wastePieceId,
    String newClassification,
    String reason,
    UUID changedBy
) {
    WastePiece waste = getById(wastePieceId);
    String oldClassification = waste.getWasteType();
    
    // Update waste piece
    waste.setWasteType(newClassification);
    waste.setClassificationDate(LocalDateTime.now());
    waste = save(waste);
    
    // Record in history
    recordClassificationChange(waste, oldClassification, reason, changedBy);
    
    log.info("Waste classified: id={}, {} -> {}", 
        wastePieceId, oldClassification, newClassification);
    
    return waste;
}

private void recordClassificationChange(
    WastePiece waste,
    String oldType,
    String reason,
    UUID changedBy
) {
    WasteClassificationHistory history = WasteClassificationHistory.builder()
        .wastePiece(waste)
        .oldWasteType(oldType)
        .newWasteType(waste.getWasteType())
        .changedBy(changedBy)
        .changeReason(reason)
        .changedAt(LocalDateTime.now())
        .build();
    
    classificationHistoryRepository.save(history);
}
```

#### NEW METHOD: `consumeWastePiece()`
```java
/**
 * Mark waste piece as consumed in another cutting operation
 * Updates status and consumption tracking
 */
public WastePiece consumeWastePiece(
    UUID wastePieceId,
    UUID consumedInOperationId,
    Integer quantityUsed
) {
    WastePiece waste = getById(wastePieceId);
    
    waste.setConsumedInCuttingOperationId(consumedInOperationId);
    waste.setConsumedAt(LocalDateTime.now());
    waste.setConsumedQuantity(quantityUsed);
    waste.setStatus(WasteStatus.USED_IN_ORDER);
    
    waste = save(waste);
    log.info("Waste consumed: id={}, qty={}", wastePieceId, quantityUsed);
    
    return waste;
}
```

#### Query Enhancement: `getWasteByClassification()`
```java
/**
 * Find waste pieces by classification type
 * Filter for REUSABLE items available for future operations
 */
public Page<WastePiece> getByWasteType(
    String wasteType,
    Pageable pageable
) {
    return repository.findByWasteTypeAndStatus(
        wasteType,
        WasteStatus.AVAILABLE,
        pageable
    );
}
```

---

### 3. CommandeItemService

#### NEW METHOD: `updateWithCuttingCompletion()`
```java
/**
 * Update order item with cutting operation completion
 * Marks item as COMPLETED with actual metrics
 */
public CommandeItem updateWithCuttingCompletion(
    UUID itemId,
    UUID cuttingOperationId,
    Integer actualPiecesCut,
    BigDecimal actualSurfaceCutM2
) {
    CommandeItem item = getById(itemId);
    
    // Validate fulfillment
    if (actualPiecesCut < item.getQuantite()) {
        log.warn("Warning: Actual pieces {} < requested {}", 
            actualPiecesCut, item.getQuantite());
    }
    
    // Update item
    item.setCuttingOperationId(cuttingOperationId);
    item.setCutDate(LocalDateTime.now());
    item.setActualPiecesCut(actualPiecesCut);
    item.setActualSurfaceCutM2(actualSurfaceCutM2);
    item.setStatus("COMPLETED"); // Mark as complete
    
    item = save(item);
    log.info("Order item completed: id={}, operation_id={}", itemId, cuttingOperationId);
    
    return item;
}
```

#### Query Enhancement: `getUnfulfilledItems()`
```java
/**
 * Get order items awaiting cutting
 * Status = PENDING or IN_PROGRESS  
 * No cutting_operation_id assigned yet
 */
public List<CommandeItem> getUnfulfilledItems() {
    return repository.findByCuttingOperationIdIsNullAndStatusIn(
        Arrays.asList("PENDING", "IN_PROGRESS")
    );
}
```

#### Query Enhancement: `getItemsByCommande()`
Keep existing but add status filtering:
```java
public List<CommandeItem> getByCommandeIdAndStatus(UUID commandeId, String status) {
    return repository.findByCommandeIdAndStatus(commandeId, status);
}
```

---

### 4. RollService

#### NEW METHOD: `recordCuttingOperation()`
```java
/**
 * Update roll metrics after cutting
 * Records: remaining dimensions, cuts, waste
 */
public void recordCuttingOperation(
    UUID rollId,
    BigDecimal consumedLengthM,
    BigDecimal wasteAreaM2
) {
    Roll roll = getById(rollId);
    
    // Update cutting tracking
    roll.setLastCutDate(LocalDateTime.now());
    roll.setTotalCuts(roll.getTotalCuts() + 1);
    roll.setTotalWasteAreaM2(
        roll.getTotalWasteAreaM2().add(wasteAreaM2)
    );
    
    // Update dimensions
    if (roll.getRemainingLengthM() != null && consumedLengthM != null) {
        roll.setRemainingLengthM(
            roll.getRemainingLengthM().subtract(consumedLengthM)
        );
    }
    
    save(roll);
    log.info("Roll recording: id={}, cuts={}, waste={}m²", 
        rollId, roll.getTotalCuts(), roll.getTotalWasteAreaM2());
}
```

#### Query Enhancement: `getRollCuttingHistory()`
```java
/**
 * Get all cutting operations performed on a roll
 * Shows material usage pattern and efficiency
 */
public List<CuttingOperation> getCuttingHistory(UUID rollId) {
    return cuttingOperationRepository.findByRollIdOrderByTimestampDesc(rollId);
}
```

---

## REPOSITORY QUERIES NEEDED

### CuttingOperationRepository
```java
List<CuttingOperation> findByCommandeItemId(UUID commandeItemId);
List<CuttingOperation> findByRollIdOrderByTimestampDesc(UUID rollId);
List<CuttingOperation> findByStatusAndRollId(String status, UUID rollId);
```

### WastePieceRepository
```java
List<WastePiece> findByWasteTypeAndStatus(String wasteType, WasteStatus status);
List<WastePiece> findByRollId(UUID rollId);
List<WastePiece> findByFromCuttingOperationId(UUID cuttingOperationId);
```

### CommandeItemRepository
```java
List<CommandeItem> findByCuttingOperationIdIsNullAndStatusIn(List<String> statuses);
List<CommandeItem> findByCommandeIdAndStatus(UUID commandeId, String status);
```

### WasteClassificationHistoryRepository (NEW)
```java
List<WasteClassificationHistory> findByWastePieceIdOrderByChangedAtDesc(UUID wastePieceId);
```

---

## TRANSACTION HANDLING

### Critical: Atomic Cutting Completion
```java
@Transactional
public CuttingOperationCompleteResponse completeCuttingWithWaste(...) {
    // All operations must succeed or all rollback
    // Including: operation, wastes, roll, order item updates
}
```

This ensures:
- Waste is not created without order item being updated
- Roll metrics don't update if operation fails
- Order items don't show complete if wastes not created

---

## ERROR HANDLING

### Custom Exceptions Needed
```java
class InvalidOperationStatusException extends RuntimeException { }
class InvalidStatusTransitionException extends RuntimeException { }
class InsufficientRollMaterialException extends RuntimeException { }
class WastePieceAlreadyConsumedException extends RuntimeException { }
```

---

## LOGGING & AUDIT

Add structured logging for:
- Cutting completion with waste generation
- Waste classification changes
- Roll dimension updates
- Order item completion

Example:
```java
log.info("CUTTING_COMPLETED: operation_id={}, waste_qty={}, order_item_id={}", 
    operationId, wasteCount, commandeItemId);
```

---

## TESTING CHECKLIST

- [ ] Create waste pieces from cutting operation
- [ ] Auto-classify waste by area (DECHET vs REUSABLE)
- [ ] Update roll remaining dimensions
- [ ] Update order item status to COMPLETED
- [ ] Handle case where no order item linked
- [ ] Prevent status transitions out of order
- [ ] Track waste consumption across operations
- [ ] Audit waste classification changes
- [ ] Transaction rollback on any failure

---

## NEXT: API ENDPOINTS

Once services are ready, implement:
```
POST   /api/cutting-operations/{id}/complete    - Complete with waste
PATCH  /api/cutting-operations/{id}/status      - Update status
POST   /api/waste-pieces/{id}/classify          - Classify waste
GET    /api/waste-pieces/by-type                - Filter waste
GET    /api/commandes/items/unfulfilled         - Pending items
```

---

## QUICK REFERENCE: WORKFLOW ORCHESTRATION

```
Input: CuttingOperationRequest + CommandeItemId

1. Validate & Create CuttingOperation (status=PREPARED)
2. Run nesting algorithm (external)
3. Call completeCuttingWithWaste():
   → Generate waste pieces (DECHET/REUSABLE)
   → Update roll metrics  
   → Mark order item COMPLETED
   → Audit log all changes
4. Return response with:
   - Updated operation with COMPLETED status
   - Created waste pieces
   - Updated order item
   - Updated roll state

Result: Order fulfilled end-to-end ✓
```
