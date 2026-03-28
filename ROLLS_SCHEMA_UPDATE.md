# Rolls Table Schema Update

## Overview
Updated the `rolls` table schema to include comprehensive inventory tracking with material specifications, consumption tracking, waste classification, and QR code management.

## Changes Made

### 1. Database Schema (V1__create_core_tables.sql)

#### New Fields Added:

**Material Specifications:**
- `nb_plis` (INTEGER): Number of plies/layers in the roll
- `thickness_mm` (DECIMAL(8,3)): Thickness of material in millimeters

**Dimension Fields Renamed/Clarified:**
- `width_mm` → `width_initial_mm`: Initial width at reception
- `length_m` → `length_initial_m`: Initial length at reception
- `area_m2` → `area_initial_m2`: Initial surface area at reception

**Consumption Tracking Fields:**
- `surface_consumed_m2` (DECIMAL(12,4)): Total surface area consumed/cut from this roll
- `surface_remaining_m2` (DECIMAL(12,4)): Remaining surface area available for cutting
- `length_remaining_m` (DECIMAL(10,2)): Remaining length in meters
- `surface_remaining_percent` (DECIMAL(5,2)): Percentage of material remaining (0-100%)

**Classification & Identification:**
- `waste_type` (VARCHAR(50)): Type classification - "Chute_Exploitable", "Déchet", "Normal"
- `qr_code` (VARCHAR(500)): QR code for inventory tracking and identification

**Field Reorganization:**
- `received_date` moved to top (Reception section)
- `supplier_id` moved to Reception section
- `status` and `location` remain in Status & Classification section

### 2. Java Entity Class (Roll.java)

**Updated Fields:**
```java
private LocalDate receivedDate;
private Supplier supplier;
private MaterialType materialType;
private Integer nbPlis;
private BigDecimal thicknessMm;
private Integer widthInitialMm;
private BigDecimal lengthInitialM;
private BigDecimal areaInitialM2;
private BigDecimal surfaceConsumedM2;
private BigDecimal surfaceRemainingM2;
private BigDecimal lengthRemainingM;
private BigDecimal surfaceRemainingPercent;
private RollStatus status;
private WasteType wasteType;
private String location;
private String qrCode;
private String originalQuantity;
private UUID createdBy;
private LocalDateTime createdAt;
private LocalDateTime updatedAt;
```

**New Methods:**
- `initializeConsumption()`: Initialize roll with calculated remaining area and percentage
- `calculateRemainingPercent()`: Calculate remaining surface percentage
- `updateConsumption(BigDecimal consumedArea, BigDecimal remainingLength)`: Update consumption after cutting

### 3. WasteType Enum (NEW)

Created new enum class: `WasteType.java`

**Values:**
- `CHUTE_EXPLOITABLE`: Usable scrap - can be reused in cutting operations
- `DECHET`: Waste - too small or unusable for cutting
- `NORMAL`: Standard material - regular inventory

### 4. RollRequest DTO

**Updated Fields:**
- Reception & Supplier section
- Material Specifications section (nbPlis, thicknessMm)
- Initial Dimensions section (widthInitialMm, lengthInitialM, areaInitialM2)
- Consumption Tracking section (surfaceConsumedM2, surfaceRemainingM2, lengthRemainingM, surfaceRemainingPercent)
- Status & Classification section (status, wasteType, location, qrCode)

**Validation:**
- All dimensional fields use appropriate validators (@NotNull, @Positive, @DecimalMin)
- Percentage field validated between 0-100

### 5. RollResponse DTO

**Reorganized Fields:**
- Basic ID
- Reception & Supplier info
- Material Specifications
- Initial Dimensions
- Consumption Tracking
- Status & Classification
- Audit Information
- Convenience flags

### 6. RollMapper

**Updated Mapping Logic:**
- `toEntity()`: Maps all new fields with fallback logic for consumption tracking
- `updateEntity()`: Handles partial updates for all fields
- `toResponse()`: Maps complete entity to response DTO

## Migration Path

To apply these changes in production:

1. **Run Flyway migration**: V1__create_core_tables.sql will be automatically applied
2. **Recompile Backend**: Maven will pick up new entity and DTO changes
3. **Deploy**: No data migration needed - existing rolls will retain backward compatibility through NULL defaults

## API Impact

### RollRequest Structure (New)
```json
{
  "receivedDate": "2026-03-24",
  "supplierId": "uuid",
  "materialType": "PU",
  "nbPlis": 1,
  "thicknessMm": 2.5,
  "widthInitialMm": 1000,
  "lengthInitialM": 50.00,
  "areaInitialM2": 50.00,
  "surfaceConsumedM2": 0.00,
  "surfaceRemainingM2": 50.00,
  "lengthRemainingM": 50.00,
  "surfaceRemainingPercent": 100.00,
  "status": "AVAILABLE",
  "wasteType": "NORMAL",
  "location": "Chute-1",
  "qrCode": "QR-CODE-STRING",
  "originalQuantity": "1 roll"
}
```

### RollResponse Structure (Updated)
Same structure as RollRequest plus audit fields (createdBy, createdAt, updatedAt) and availableForCutting flag.

## Backward Compatibility

- Existing roll data continues to work
- New fields have sensible defaults
- Old field names (widthMm, lengthM, areaMm2) are replaced by clearer names

## Testing Recommendations

1. Test roll creation with all new fields
2. Test consumption tracking updates
3. Test waste_type classification filtering
4. Test QR code generation and tracking
5. Test FIFO selection with new schema
