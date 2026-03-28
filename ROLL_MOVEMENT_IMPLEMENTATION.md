# Roll Movement Operations Implementation Guide

## Overview
Complete tracking system for roll movements between altiers (workshops) with timestamps, historical information, and full audit trail.

## Database Changes

### Migration File: V6__create_roll_movement_table.sql
Creates the `roll_movements` table with the following columns:
- `id` - UUID primary key
- `roll_id` - Foreign key to rolls table
- `from_altier_id` - Source workshop (nullable for supplier receipts)
- `to_altier_id` - Destination workshop
- `date_sortie` - Timestamp when roll left source location
- `date_entree` - Timestamp when roll arrived at destination
- `reason` - Movement reason (CUTTING, TRANSFER, STORAGE, etc.)
- `operator_id` - User who recorded the movement
- `notes` - Additional documentation
- `reference_number` - Link to related operations (cutting ID, etc.)
- `created_at`, `updated_at` - Audit timestamps

**Indexes created for performance:**
- idx_roll_movements_roll_id
- idx_roll_movements_from_altier
- idx_roll_movements_to_altier
- idx_roll_movements_date_entree
- idx_roll_movements_operator_id

## Backend Implementation

### Entity: RollMovement
Location: `domain/rolls/entity/RollMovement.java`
- Represents a single roll movement operation
- Includes calculated duration (getDurationHours)
- Validates movement completeness

### Repository: RollMovementRepository
Location: `domain/rolls/repository/RollMovementRepository.java`
Methods:
- `findByRollIdOrderByDateEntreeDesc()` - Get all movements for a roll
- `findMovementsByRollInDateRange()` - Movements within date range
- `findByToAltierIdOrderByDateEntreeDesc()` - Incoming movements to altier
- `findByFromAltierIdOrderByDateSortieDesc()` - Outgoing movements from altier
- `findLatestMovementByRollId()` - Current location of roll
- `findByOperatorIdOrderByCreatedAtDesc()` - Movements by operator

### DTOs: RollMovementDTO & RollMovementRequest
Location: `domain/rolls/dto/RollMovementDTO.java`
- `RollMovementDTO` - Response DTO with all details
- `RollMovementRequest` - Request DTO for creating movements

### Mapper: RollMovementMapper
Location: `domain/rolls/mapper/RollMovementMapper.java`
- Converts between entity and DTOs
- Includes nested mappings for Altier and User

### Service: RollMovementService
Location: `domain/rolls/service/RollMovementService.java`
Methods:
- `recordMovement()` - Record new roll movement
- `getRollMovementHistory()` - Get all movements for a roll
- `getCurrentLocation()` - Get current roll location
- `getMovementsToAltier()` - Get incoming movements
- `getMovementsFromAltier()` - Get outgoing movements
- `getOperatorMovements()` - Get operator's recorded movements
- `updateMovement()` - Edit movement details
- `deleteMovement()` - Remove movement record

### Controller: RollMovementController
Location: `api/controller/RollMovementController.java`
Endpoints:
```
POST   /api/roll-movements                           - Record new movement
GET    /api/roll-movements/roll/{rollId}/history    - Movement history
GET    /api/roll-movements/roll/{rollId}/current-location - Current location
GET    /api/roll-movements/altier/{altierID}/incoming    - Incoming movements
GET    /api/roll-movements/altier/{altierID}/outgoing    - Outgoing movements
GET    /api/roll-movements/operator/{operatorId}        - Operator movements
PUT    /api/roll-movements/{movementId}             - Update movement
DELETE /api/roll-movements/{movementId}             - Delete movement
```

## Frontend Implementation

### Service: rollMovementService.ts
Location: `src/services/rollMovementService.ts`
- Handles all API calls for roll movements
- Type definitions for RollMovement and RollMovementRequest
- Methods mirror backend endpoints

### Page: RollMovementPage
Location: `src/pages/RollMovementPage.tsx`
Features:
- Display movement history in table format
- Record new movements with form
- Show source and destination altiers
- Calculated duration display
- Operator information
- Notes and reference tracking

### Styling: RollMovementPage.css
Location: `src/styles/RollMovementPage.css`
- Responsive design (desktop, tablet, mobile)
- Table layout with sorting capability
- Form styling with validation feedback
- Mobile-friendly card view for small screens

### Front-end Types
Updated `src/types/index.ts` with:
- `RollMovement` interface
- `RollMovementRequest` interface

### Route Configuration
Added route in `src/App.tsx`:
```
/roll/:rollId/movements -> RollMovementPage
```

## Features

### Multi-Location Tracking
- Track roll movements between different altiers
- Support for supplier receipts (NULL from_altier)
- Historical audit trail of all movements

### Timestamp Tracking
- `date_sortie`: When roll leaves source
- `date_entree`: When roll arrives at destination
- Automatic duration calculation

### Audit Trail
- Recorded by operator (user ID)
- Reference to related operations (cutting ID, order number)
- Reason for movement (CUTTING, TRANSFER, STORAGE)
- Additional notes for documentation

### Operational Queries
- Get complete movement history for a roll
- Find current location of any roll
- Track all movements to/from specific altiers
- View operator activity history
- Date range filtering

## API Examples

### Record a Movement
```bash
POST /api/roll-movements?rollId=<uuid>&toAltierID=<uuid>&dateSortie=<datetime>&dateEntree=<datetime>&operatorId=<uuid>
```

### Get Roll Location History
```bash
GET /api/roll-movements/roll/{rollId}/history
```

### Get Current Roll Location
```bash
GET /api/roll-movements/roll/{rollId}/current-location
```

### Get Movements to a Workshop
```bash
GET /api/roll-movements/altier/{altierID}/incoming
```

## Access Control
- All endpoints require authentication
- Non-admin users can view movements
- Operators can record movements for rolls at their assigned altiers
- Admins have full access

## Usage
1. Navigate to Roll Detail page for any roll
2. Click "View Movements" or go to `/roll/{rollId}/movements`
3. View complete movement history in grid
4. Click "+ Record Movement" to add new movement
5. Fill in source/destination altiers and timestamps
6. Add reason, notes, and reference number
7. System captures operator information automatically

## Future Enhancements
- Movement type classification (internal transfer, supplier receipt, shipping)
- Integration with cutting operations for automatic movement recording
- Movement approval workflow
- Location validation against user altier assignments
- Movement alerts and notifications
