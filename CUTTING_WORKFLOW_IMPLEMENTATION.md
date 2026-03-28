# CUTTING WORKFLOW IMPLEMENTATION GUIDE
**Date**: March 27, 2026  
**Status**: In Progress

## Overview
This document describes the enhanced cutting workflow that integrates cutting operations with order management (Commandes). The workflow tracks waste classification, roll consumption, and updates order item statuses automatically.

---

## WORKFLOW SEQUENCE

### 1. CUTTING OPERATION CREATION
```
1. User selects a Roll
2. User selects a CommandeItem (Order Item) to fulfill
3. User enters cutting specifications (width, length, quantity)
4. Nesting algorithm runs to optimize material usage
5. Results shown: utilization %, waste area, piece placements
6. Operator confirms cut
7. CuttingOperation record created with status = "COMPLETED"
```

### 2. WASTE PIECE GENERATION
When a cutting operation completes:
```
1. System calculates waste from nesting result
2. For each waste piece:
   a. Create WastePiece record with:
      - roll_id: Original roll reference
      - from_cutting_operation_id: Source cutting operation
      - wasteType: DECHET (default) or REUSABLE (if > 3m²)
      - status: AVAILABLE
3. Store quantity, dimensions, weight
4. Add to waste inventory
```

### 3. ROLL STATE UPDATE
After cutting:
```
1. Update roll tracking:
   - remaining_length_m: Decrease by consumed length
   - remaining_width_mm: Update if partially used
   - last_cut_date: Set to now()
   - total_cuts: Increment counter
   - total_waste_area_m2: Add waste from this operation
   
2. Update roll consumption:
   - surface_consumed_m2: Increase
   - surface_remaining_m2: Decrease
   - Update percentage calculations
```

### 4. ORDER ITEM STATUS UPDATE
After cutting verifies fulfillment:
```
1. Update commande_item where id = commandeItemId:
   - status: Change from "PENDING" or "IN_PROGRESS" to "COMPLETED"
   - cutting_operation_id: Link to the operation
   - cut_date: Timestamp of cut
   - actual_surface_cut_m2: Actual consumed surface
   - actual_pieces_cut: Actual pieces produced
```

### 5. WASTE CLASSIFICATION
After operation completes, waste can be classified:
```
1. Operator reviews waste pieces
2. For each waste:
   a. If >= 3m² and suitable: wasteType = "REUSABLE"
   b. If < 3m² or unusable: wasteType = "DECHET"
   c. Set classification_date: now()
   d. Save to waste_classification_history
3. Reusable waste available for future operations
```

---

## DATABASE SCHEMA CHANGES (V18)

### New Columns

#### cutting_operations
- `commande_item_id UUID` - Link to order item being fulfilled
- `status VARCHAR(20)` - PREPARED, IN_PROGRESS, COMPLETED, ON_HOLD, CANCELLED

#### waste_pieces
- `roll_id UUID` - Direct reference to source roll (NEW)
- `waste_type VARCHAR(20)` - DECHET or REUSABLE (NEW)
- `quantity_pieces INTEGER` - Number of pieces created (NEW)
- `weight_kg DECIMAL(10,2)` - Weight tracking (NEW)
- `classification_date TIMESTAMP` - When classified (NEW)
- `consumed_in_cutting_operation_id UUID` - If reused (NEW)
- `consumed_at TIMESTAMP` - When consumed (NEW)
- `consumed_quantity INTEGER` - How many pieces used (NEW)

#### commande_items
- `cutting_operation_id UUID` - Link to fulfilling operation (NEW)
- `cut_date TIMESTAMP` - When fulfilled (NEW)
- `actual_surface_cut_m2 DECIMAL(12,4)` - Actual consumption (NEW)
- `actual_pieces_cut INTEGER` - Actual pieces produced (NEW)

#### rolls
- `remaining_length_m DECIMAL(10,2)` - Current length after cuts (NEW)
- `remaining_width_mm INTEGER` - Current width after cuts (NEW)
- `last_cut_date TIMESTAMP` - Last operation timestamp (NEW)
- `total_cuts INTEGER` - Count of operations (NEW)
- `total_waste_area_m2 DECIMAL(12,4)` - Cumulative waste (NEW)

### New Audit Table
- `waste_classification_history` - Tracks all classification changes with reason

---

## TYPE SYSTEM UPDATES

### TypeScript Enums (Frontend)
```typescript
export type WasteClassification = 'DECHET' | 'REUSABLE';
export type CuttingOperationStatus = 'PREPARED' | 'IN_PROGRESS' | 'COMPLETED' | 'ON_HOLD' | 'CANCELLED';
export type WasteItemStatus = 'AVAILABLE' | 'USED_IN_ORDER' | 'SCRAP' | 'RESERVED';
```

### Interface Updates
- `CuttingOperation`: Added commandeItemId, status, finalWasteAreaM2
- `WastePiece`: Added rollId, wasteType, quantityPieces, classificationDate
- `CommandeItem`: Added cuttingOperationId, cutDate, actualSurfaceCutM2
- `Roll`: Added remaining dimensions and tracking fields

---

## SERVICE LAYER REQUIREMENTS

### CuttingOperationService Enhancements
1. `recordCuttingWithWaste()` - Create operation AND waste pieces
2. `updateOperationStatus()` - Change cutting operation status
3. `completeCuttingOperation()` - Mark as COMPLETED and update order item

### WastePieceService Enhancements
1. `createWastePieces()` - Batch create from cutting result
2. `classifyWaste()` - DECHET ↔ REUSABLE classification
3. `consumeWastePiece()` - Mark as used in another operation

### CommandeItemService Enhancements
1. `updateWithCuttingOperation()` - Link operation and mark COMPLETED
2. `getRemainingItems()` - Get unfulfilled items for cutting

### RollService Enhancements
1. `updateAfterCutting()` - Update remaining dimensions and tracking
2. `getRollCuttingHistory()` - Get all operations on a roll

---

## FRONTEND - CUTTING PAGE WORKFLOW

### Enhanced CuttingForm
1. Roll Selection
   - Show available rolls
   - Display current dimensions (width, length)
   - Show utilization history

2. Commande Item Selection (NEW)
   - Filter by status = PENDING or IN_PROGRESS
   - Show material specs and quantity needed
   - Link operation to order

3. Cutting Specifications
   - Nesting algorithm integration
   - Utilization preview
   - Waste projection

4. Waste Classification (NEW)
   - After operation: classify waste as REUSABLE or DECHET
   - Show reusable waste availability for future cuts

5. Confirmation Summary
   - Show order item status updates
   - Show waste generation
   - Show roll remaining dimensions

### WastePage Enhancements
- Filter by waste_type (DECHET vs REUSABLE)
- Bulk classification interface
- Consumption tracking (where waste was reused)
- Export for disposal management

---

## IMPLEMENTATION PRIORITY

### Phase 1: DATABASE & BACKEND (COMPLETE)
✓ Migration V18 created
✓ Entity updates (CuttingOperation, WastePiece, CommandeItem, Roll)
✓ Types updated (TypeScript)
- [ ] DTOs and Mappers updated
- [ ] Service layer enhancements
- [ ] Repository queries for new fields
- [ ] Transaction handling for atomic updates

### Phase 2: API ENDPOINTS
- [ ] POST /api/cutting-operations/with-waste
- [ ] PATCH /api/cutting-operations/{id}/status
- [ ] POST /api/waste-pieces/classify
- [ ] GET /api/waste-pieces/by-classification
- [ ] GET /api/commandes/items/unfulfilled

### Phase 3: FRONTEND UI
- [ ] Update CuttingPage with commande item selection
- [ ] Waste classification form
- [ ] Roll tracking dashboard
- [ ] Waste inventory management

### Phase 4: TESTING & DEPLOYMENT
- [ ] Run migrations
- [ ] Integration tests
- [ ] Load tests for waste queries
- [ ] User acceptance testing
- [ ] Production deployment

---

## KEY BUSINESS LOGIC

### Waste Classification Rules
1. Automatically REUSABLE if:
   - Area >= 3m²
   - Material is compatible with future operations
   - No defects

2. Manually override possible when:
   - Operator identifies defect
   - Material damaged
   - Customer specification requires disposal

### Roll Dimension Updates
- After each cutting: Calculate consumed length/width
- Track remaining material for future operations
- Flag for disposal when < minimum threshold

### Order Completion
- Item marked COMPLETED only when:
  - Cutting operation linked
  - Actual pieces match or exceed requested
  - Surface consumption recorded
  - No manual override needed

---

## AUDIT & COMPLIANCE

### Tracked Events
1. Cutting operations with role-based authorization
2. Waste classification changes with reason
3. Roll consumption with material traceability
4. Order fulfillment with timestamps

### Reporting
- Material utilization efficiency by operator
- Waste generation and reuse rates
- Order fulfillment timeline
- Roll consumption patterns

---

## DEPLOYMENT CHECKLIST

- [ ] Review migration V18 for conflicts
- [ ] Backup database before migration
- [ ] Run: `mvn flyway:migrate`
- [ ] Rebuild backend: `mvn clean install`
- [ ] Rebuild frontend: `npm run build`
- [ ] Update API documentation
- [ ] Train operators on new workflow
- [ ] Monitor cutting operations in first week
- [ ] Adjust waste classification thresholds if needed

---

## NEXT STEPS

1. Review and approve this document
2. Create DTOs for waste classification workflow
3. Implement atomic transaction handling in services
4. Add comprehensive logging for audit trail
5. Update API documentation
6. Create UI mockups for new workflow
7. Begin Phase 2 API endpoint implementation
