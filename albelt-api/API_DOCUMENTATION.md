# ALBEL Stock Management System - REST API Documentation

## Overview

Complete REST API for ALBEL stock management with intelligent FIFO inventory control and waste reduction tracking.

**Base URL**: `http://localhost:8080/api`  
**Interactive Docs**: `http://localhost:8080/swagger-ui.html` (Swagger/OpenAPI)

---

## API Controllers & Endpoints

### 1. Supplier Management (`/api/suppliers`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/suppliers` | Create new supplier |
| GET | `/api/suppliers` | List all suppliers |
| GET | `/api/suppliers/{id}` | Get supplier by ID |
| GET | `/api/suppliers/search/name?name={name}` | Find by name (exact match) |
| GET | `/api/suppliers/search/country?country={country}` | Find by country |
| GET | `/api/suppliers/search/pattern?pattern={pattern}` | Search by name pattern |
| PUT | `/api/suppliers/{id}` | Update supplier |
| DELETE | `/api/suppliers/{id}` | Delete supplier |

**Note**: Simple CRUD operations, no performance tracking (ERP-ready for future enhancement)

---

### 2. Roll Inventory Management (`/api/rolls`)

#### Core FIFO Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rolls/receive` | Receive new roll (stock in) |
| GET | `/api/rolls/fifo/select?material={material}` | **FIFO** - Get oldest roll for cutting |
| GET | `/api/rolls/fifo/queue?material={material}` | View FIFO queue for material |
| PATCH | `/api/rolls/{id}/status?newStatus={status}` | Update roll status |

#### Inventory Lookup
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rolls/{id}` | Get roll by ID |
| GET | `/api/rolls/supplier/{supplierId}` | Get all rolls from supplier |
| GET | `/api/rolls/search/by-size?material={material}&area={area}` | Find rolls with sufficient area |

#### Inventory Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/rolls/stats/count?material={material}` | Count available rolls |
| GET | `/api/rolls/stats/area?material={material}` | Total available area (m²) |

**Status Values**: `AVAILABLE`, `IN_PRODUCTION`, `COMPLETED`

---

### 3. Cutting Operations (`/api/cutting-operations`)

#### Transaction Recording
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cutting-operations/{id}` | Get operation by ID |
| GET | `/api/cutting-operations/roll/{rollId}` | Get all operations on roll |
| GET | `/api/cutting-operations/operator/{operatorId}` | History by operator |

#### Performance Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cutting-operations/analytics/high-efficiency` | Operations > 75% utilization |
| GET | `/api/cutting-operations/analytics/significant-waste` | Operations with > 3m² waste |
| GET | `/api/cutting-operations/analytics/operator-performance` | Average utilization by operator |
| GET | `/api/cutting-operations/analytics/by-date-range?start={start}&end={end}` | Time-range query |
| GET | `/api/cutting-operations/analytics/total-count` | Total operations |

**Performance Flags** (auto-calculated):
- `highEfficiency`: Utilization > 75%
- `significantWaste`: Waste > 3m²

---

### 4. Waste Management (`/api/waste-pieces`)

#### Reuse Tracking (Core Feature)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/waste-pieces/reuse/find?material={material}&requiredArea={area}` | **CRITICAL** - Find reuse candidate |
| GET | `/api/waste-pieces/reuse/large?page={page}&size={size}` | Large waste (> 3m²) for reuse |
| PATCH | `/api/waste-pieces/{id}/mark-used?cuttingOpId={cuttingOpId}` | Mark as reused |
| PATCH | `/api/waste-pieces/{id}/mark-scrap` | Mark as unsalvageable |

#### Inventory Lookup
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/waste-pieces/{id}` | Get waste piece by ID |
| GET | `/api/waste-pieces/available?material={material}&page={page}&size={size}` | Available by material |
| GET | `/api/waste-pieces/cutting-operation/{cuttingOpId}` | Waste from operation |

#### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/waste-pieces/stats/count?status={status}` | Count by status |
| GET | `/api/waste-pieces/stats/reuse-efficiency?material={material}` | % reused (vs scraped) |
| GET | `/api/waste-pieces/stats/total-area` | Total waste area by material |

**Status Values**: `AVAILABLE`, `USED_IN_PRODUCTION`, `SCRAP`  
**Waste Classification** (Auto):
- `> 3000mm or > 3m²` → AVAILABLE (reusable)
- `< 3000mm or < 3m²` → SCRAP (not economical)

---

### 5. User Management (`/api/users`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/{id}` | Get user by ID |
| GET | `/api/users/search/username?username={username}` | Find by username |
| GET | `/api/users/active` | List active users |
| GET | `/api/users/by-role?role={role}` | Filter by role |
| GET | `/api/users/operators` | List active operators (for assignments) |
| PATCH | `/api/users/{id}/activate` | Reactivate user |
| PATCH | `/api/users/{id}/deactivate` | Deactivate user |
| PATCH | `/api/users/{id}/role?newRole={role}` | Change user role |

**Role Values**: `ADMIN`, `SUPERVISOR`, `OPERATOR`

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* resource or array */ },
  "timestamp": "2024-01-15T10:30:00"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Resource not found",
  "data": null,
  "timestamp": "2024-01-15T10:30:00"
}
```

### Validation Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "data": {
    "fieldName": "error message",
    "anotherField": "another error"
  },
  "timestamp": "2024-01-15T10:30:00"
}
```

---

## HTTP Status Codes

| Code | Meaning | Use Case |
|------|---------|----------|
| 200 | OK | Successful GET/PUT/PATCH |
| 201 | Created | Successful POST (new resource) |
| 400 | Bad Request | Validation errors, invalid parameters |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Business rule violation (e.g., deletion of supplier with active rolls) |
| 500 | Internal Server Error | Unexpected server error |

---

## Query Parameters & Pagination

### Pagination Pattern
```
?page=0&size=20
```
- `page`: Zero-based page number (default: 0)
- `size`: Results per page (default: 20, max: 100)

### Filtering Pattern
```
?material=PU&status=AVAILABLE
```
Filters passed as query parameters, applied server-side

---

## Request Validation

All POST/PUT requests validate input using Jakarta Bean Validation:

```json
// Example: Create Supplier
POST /api/suppliers
{
  "name": "Supplier Name",
  "address": "123 Street",
  "city": "Algiers",
  "country": "DZ",
  "contactPerson": "Contact Name",
  "email": "contact@supplier.com",
  "phone": "+213555123456"
}
```

Validation errors return **400 Bad Request** with field-level error messages.

---

## CORS Configuration

The API is configured to accept cross-origin requests from:
- `http://localhost:3000` (React dev server)
- `http://localhost:8080` (local alternative)

Allowed methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`

---

## Exception Handling

All endpoints use a global exception handler (`GlobalExceptionHandler`):

| Exception | Status | Response |
|-----------|--------|----------|
| `ResourceNotFoundException` | 404 | Entity not found |
| `BusinessException` | 409 | Business rule violated |
| `MethodArgumentNotValidException` | 400 | DTO validation failed |
| `IllegalArgumentException` | 400 | Invalid argument |
| Generic `Exception` | 500 | Unexpected error |

---

## API Evolution & TODO Items

### Current Status ✅
- [x] 5 REST Controllers (Supplier, Roll, CuttingOperation, WastePiece, User)
- [x] Exception handling (global @RestControllerAdvice)
- [x] CORS configuration
- [x] OpenAPI/Swagger documentation

### Planned Enhancements
- [ ] **Authentication/Authorization**: Spring Security + JWT tokens
- [ ] **Nesting Algorithm Integration**: Guillotine 2D bin packing for cut optimization
- [ ] **Advanced Analytics**: Dashboard data endpoints
- [ ] **Export/Import**: CSV, Excel export of reports
- [ ] **Real-time Notifications**: WebSocket support for inventory alerts
- [ ] **Audit Logging**: Spring AOP for API call tracking

---

## Example Usage

### 1. Receive a Roll
```bash
POST /api/rolls/receive
{
  "materialType": "PU",
  "supplierId": "550e8400-e29b-41d4-a716-446655440000",
  "widthMm": 1000,
  "lengthM": 50
}
```
**Response**:
```json
{
  "success": true,
  "message": "Roll received successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "materialType": "PU",
    "areaMsquared": 50,
    "status": "AVAILABLE",
    "receivedDate": "2024-01-15T10:30:00"
  }
}
```

### 2. Select Roll by FIFO
```bash
GET /api/rolls/fifo/select?material=PU
```
**Response**: Returns oldest available PU roll

### 3. Find Waste for Reuse
```bash
GET /api/waste-pieces/reuse/find?material=PU&requiredArea=5
```
**Response**: First available waste piece >= 5m² for reuse

### 4. Mark Waste as Used
```bash
PATCH /api/waste-pieces/{wasteId}/mark-used?cuttingOpId={opId}
```
**Response**: Status updated to `USED_IN_PRODUCTION`

---

## Monitoring & Debugging

### Swagger UI
Access interactive documentation and test endpoints:
- **URL**: `http://localhost:8080/swagger-ui.html`
- **Try it out** feature for manual testing

### Logging
All controllers use SLF4J logging:
- INFO: High-level operations
- DEBUG: Query details
- WARN: Business violations
- ERROR: System failures

---

## Security Notes (TODO)

⚠️ **Current State**: All endpoints are OPEN (no authentication)

**Plan**:
1. Spring Security + JWT authentication
2. Role-based access control (RBAC)
3. Request signing for sensitive operations
4. API rate limiting

---

## Performance Index Summary

All FIFO and reuse operations are optimized with composite indexes:

| Operation | Index | Est. Response Time |
|-----------|-------|-------------------|
| FIFO selection | `(material_type, status, received_date ASC)` | < 10ms |
| Reuse candidate | `(material_type, status, area_m2 DESC)` | < 10ms |
| Operator stats | `(operator_id, created_at)` | < 50ms |

---

## Version History

- **v1.0.0** (Current): Initial REST API with 5 controllers, 30+ endpoints
