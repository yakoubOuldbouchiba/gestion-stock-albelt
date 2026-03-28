# 📋 PRODUCT OWNER ANALYSIS - ALBEL Stock Management System

**Date**: March 23, 2026  
**Product**: Gestion de Stock - Bandes Transporteuses  
**Client**: ALBEL  
**Status**: Requirements Analysis Phase

---

## 🎯 EXECUTIVE SUMMARY

ALBEL manufactures conveyor belts (PU, PVC, Caoutchouc) and needs an intelligent stock management system with optimized cutting capabilities to:
- Minimize material waste
- Implement FIFO (First In, First Out) discipline
- Automate cutting plan generation
- Track historical operations
- Support intra-factory deployment (local/Docker)

**Estimated Scope**: 600-800 development hours over 4-6 months

---

## 🏗️ ARCHITECTURE OVERVIEW

### Recommended Stack
```
Frontend:     React.js + SVG/Canvas (visualization)
Backend:      Spring Boot (Java 17+)
Database:     PostgreSQL
Deployment:   Docker + Docker Compose (Local Intranet)
Cutting Algo: Guillotine 2D Bin Packing
```

### Deployment Model
- **Local Only**: No cloud dependency
- **Multi-user**: Intranet-based for factory floor
- **Docker**: Containerized for easy deployment across workstations

---

## 📦 REQUIREMENTS BREAKDOWN

### PHASE 0: MVP (P0 - Critical)
*Estimated: 6-8 weeks*

#### 4.1 | Stock Data Model
| Field | Type | Constraint | Notes |
|-------|------|-----------|-------|
| ID | UUID | Primary Key | Auto-generated |
| Material | ENUM | PU / PVC / Caoutchouc | Required |
| Width | Integer | mm | > 0 |
| Length | Integer | m or mm | > 0 |
| Surface | Decimal | Auto-calculated | Width × Length |
| Entry Date | DateTime | FIFO sort key | Required |
| Supplier | String | Optional | Traceability |
| Status | ENUM | Available / Opened / Exhausted | Default: Available |
| Remaining_Qty | Decimal | Tracks usage | Updated on cut |
| Storage_Location | String | Optional | Warehouse zone |

#### 4.2 | FIFO Logic
- **Rule**: Automatically select oldest available roll first
- **Override**: Manual selection allowed (logged for audit)
- **Status Handling**: 
  - Only "Available" rolls are auto-suggested
  - "Opened" rolls available but with warning
  - "Exhausted" rolls hidden from selection

#### 5.1 | Cutting Input Form
```
┌─────────────────────────────────┐
│ NOUVELLE DÉCOUPE               │
├─────────────────────────────────┤
│ Matière:     [ PU / PVC / Caout]│
│ Largeur (mm):    [ ______ ]    │
│ Longueur (m):    [ ______ ]    │
│ Quantité:        [ ______ ]    │
│ Force manuel?:   [ Override ]  │
│                                 │
│ [ AUTO-SELECT ] [ CALCUL ]     │
└─────────────────────────────────┘
```

#### 5.2 | Cutting Engine (CORE LOGIC)
1. **Selection Phase**
   - Filter rolls by material & status
   - Sort by entry date (FIFO)
   - Select best fit(s) for requested dimensions
   
2. **Optimization Phase**
   - Apply 2D Bin Packing algorithm
   - Calculate cutting plan
   - Estimate waste percentage
   
3. **Simulation Phase** (optional preview)
   - Show graphical representation
   - Display waste zones
   - User confirms before execution

#### 6 | Nesting Algorithm
**Core Challenge**: Minimize material waste via optimal 2D cutting

**Recommended Approach**: Guillotine 2D
```
Algorithm: Top-Down Guillotine Cutting

Input:
  - Roll: (WIDTH, LENGTH)
  - Pieces to cut: [(w1, l1, qty1), (w2, l2, qty2), ...]
  - Constraints: No rotation allowed OR rotation allowed

Process:
  1. Sort pieces by area (largest first)
  2. Recursively partition roll into rectangles
  3. Place pieces in each partition
  4. Track waste zones
  5. Return optimized plan

Output:
  - Cutting coordinates
  - Waste zones
  - Placement visualization
  - Utilization %
```

**Alternative**: Implement multiple algorithms & compare:
- Guillotine (simple, 70-85% utilization)
- Maximal Rectangle (better, 80-90%)
- Genetic Algorithm (best, 85-95% but slower)

---

### PHASE 1: Core Features (P1 - High Priority)
*Estimated: 8-10 weeks following MVP*

#### 7 | Visualization (CRITICAL)
**7.1 - Cutting Schema**
```
Graphical representation of:
  ✓ Full roll (outlined rectangle)
  ✓ Pieces to cut (colored zones with dimensions)
  ✓ Waste zones (cross-hatched, calculable area)
  ✓ Coordinates for each piece (x, y, reference)
  ✓ Dimensions labels
  
Implementation:
  - SVG for scalable graphics
  - React Canvas component
  - Zoom & pan interactions
  - Print-friendly layout
```

**7.2 - Waste Schema**
```
After cutting:
  ✓ Map remaining material
  ✓ Calculate size/area
  ✓ Mark as "chute" if width < 3000mm
  ✓ Create new stock entries automatically
  ✓ Visual representation of remnant
```

#### 8 | Waste Management (CRITICAL)
**When a roll is cut:**
1. Generate all waste pieces
2. Check each piece:
   - If width ≥ 3000mm → Classify as "Available" roll
   - If width < 3000mm → Classify as "Chute"
3. Create new stock entries automatically
4. Update original roll status to "Opened" or "Exhausted"
5. Log operation in history

**Chute Usage Rules**:
- Can be suggested for small orders
- Marked with "Chute" label in inventory
- Available for internal allocation

#### 9 | Dashboard & Analytics
```
┌────────────────────────────────────────┐
│        📊 TABLEAU DE BORD              │
├────────────────────────────────────────┤
│  Stock Total: 125,400 m²               │
│  ├─ PU:        45,200 m² (36%)         │
│  ├─ PVC:       52,100 m² (42%)         │
│  └─ Caoutchouc: 28,100 m² (22%)        │
│                                         │
│  Taux de perte moyenne: 14.2%          │
│  Rouleaux disponibles: 342             │
│  Rouleaux entamés: 28                  │
│  Découpes ce mois: 156                 │
│                                         │
│  Top 5 clients (par volume):           │
│  1. Toyota - 8,450 m²                  │
│  2. Bosch - 7,210 m²                   │
│  ...                                    │
└────────────────────────────────────────┘
```

#### 10 | Historical Tracking & Audit
**For each cutting operation:**
```
Operation Record:
  - Timestamp
  - User (operator name)
  - Rolls used (IDs + details)
  - Cutting plan (visual + coordinates)
  - Pieces produced
  - Waste generated
  - Utilization %
  - Customer/Project reference

Queryable by:
  - Date range
  - Operator
  - Material
  - Customer
  - Waste >/< threshold
```

#### 11 | Export Capabilities
```
PDF Export:
  ✓ Cutting plan (visual + dimensions)
  ✓ Parts list
  ✓ Instructions for workshop

Excel Export:
  ✓ Stock inventory (current state)
  ✓ Historical operations (filtered)
  ✓ Chute inventory
  ✓ Waste analysis (by material/date)

Usage:
  - Print cutting plans for workshop
  - Archive for traceability
  - Share with customers
  - Analysis in business intelligence tools
```

#### 3 | User Management (Authentication & Roles)
```
Roles:

1. ADMIN
   ├─ Full system access
   ├─ User management
   ├─ System configuration
   ├─ View all histories
   └─ Generate reports

2. OPERATION (Operator)
   ├─ Create cutting orders
   ├─ View own history
   ├─ Confirm/execute cuts
   ├─ View real-time stock
   └─ Manual override (logged)

3. READ_ONLY (Optional)
   ├─ View stock inventory
   ├─ View historical data
   ├─ Generate reports
   └─ No modification rights

Authentication:
  - Username + Password (local)
  - Session tokens (JWT or similar)
  - Password hashing (bcrypt)
  - Audit log for access
```

---

### PHASE 2: Advanced Features (P2 - Medium Priority)
*Estimated: 6-8 weeks*

#### 12 | Performance Optimization
- Nesting calculation: **< 2 seconds** for standard orders
- UI responsiveness: **< 200ms** for interactions
- Support: 10,000+ stock items without lag
- Caching strategy for frequently used dimensions

#### 13 | Advanced Dashboard
- Charts: Waste trends, utilization trends over time
- Predictive analytics: Stock depletion forecasts
- KPIs: Material efficiency, cost per m²

#### 14 | Barcode Scanning (Bonus)
- Scan roll ID for quick selection
- Barcode generation for finished pieces
- Mobile barcode reader integration
- Quick lookup without manual entry

#### 15 | Pre-cutting Simulation
- User sees cutting plan BEFORE confirming
- Can adjust dimensions/quantities
- Compare multiple scenarios
- Validate feasibility before workshop

#### 16 | Intelligent Suggestions
- System suggests optimal material combinations
- Proposes alternative dimensions if exact match not available
- Alerts on stock imbalance
- Recommends chute reordering before stock-out

---

### PHASE 3: Integration & Scaling (P3 - Low Priority)
*Estimated: 4-6 weeks*

#### 17 | ERP API Integration
- Connect to existing ERP (SAP, Odoo, etc.)
- Real-time orders from ERP → Cutting plan
- Push production results back to ERP
- Inventory sync

#### 18 | Multi-site Support
- Multiple warehouse locations
- Inter-site inventory transfer
- Centralized reporting

#### 19 | Advanced Algorithms
- Implement multiple nesting strategies
- ML-based optimization
- Predictive cutting recommendations

---

## 🔐 Data Security & Compliance

| Aspect | Requirement |
|--------|-------------|
| Authentication | Credentials never stored in plaintext |
| Database Access | Encrypted connections |
| Audit Trail | All operations logged with user/timestamp |
| Data Backup | Daily automatic backups |
| GDPR | Mark user data if applicable |
| Offline Mode | Works without internet (data sync on reconnect) |

---

## 📊 SUCCESS METRICS

| Metric | Target |
|--------|--------|
| Material Waste | Reduced from ~18% to ≤ 12% |
| Nesting Calc Speed | < 2 seconds |
| Operator Time/Cut | From 15min to 2min |
| Stock Accuracy | > 98% |
| System Uptime | 99.5% |
| User Adoption | > 90% within 2 months |

---

## 🚀 DEVELOPMENT ROADMAP

```
TIMELINE:

Week 1-2:   Setup, DB design, API scaffolding
Week 3-6:   Stock module + basic FIFO
Week 7-10:  Cutting engine + Guillotine algorithm
Week 11-14: Frontend (React) + Visualization
Week 15-18: User management, Audit, Export
Week 19-22: Dashboard + Analytics
Week 23-26: Testing, Optimization, Docker setup
Week 27-30: Phase 1 Refinement (Bugs, UX)
...
```

---

## ⚠️ CRITICAL SUCCESS FACTORS

1. **Nesting Algorithm Accuracy** - Business impact: High waste = Low profit
2. **User Interface Simplicity** - Factory operators need quick training
3. **Data Integrity** - FIFO must be respected (compliance)
4. **Real-time Visualization** - Operators need confidence in plans
5. **Offline Capability** - No internet downtime = No production halt

---

## 💾 Database Schema (High Level)

```sql
-- Users & Authentication
TABLE users (id, username, email, password_hash, role, created_at)
TABLE audit_logs (id, user_id, action, details, timestamp)

-- Stock Inventory
TABLE rolls (
  id, 
  material (enum), 
  width, 
  length, 
  surface, 
  entry_date, 
  supplier, 
  status, 
  remaining_qty,
  location,
  created_at
)

-- Cutting Operations
TABLE cutting_operations (
  id,
  user_id,
  timestamp,
  material,
  source_rolls (array/foreign keys),
  pieces (array of: width, length, qty),
  cutting_plan (JSON with coordinates),
  waste_estimation,
  utilization_pct,
  notes,
  customer_ref
)

-- Generated Waste
TABLE waste_pieces (
  id,
  from_operation_id,
  roll_id (parent),
  width,
  length,
  surface,
  classification (chute/scrap),
  status,
  created_at
)

-- Visualization Cache
TABLE cutting_visualizations (
  id,
  operation_id,
  svg_data,
  png_thumbnail,
  created_at
)
```

---

## 🎓 Key Learnings & Recommendations

### What's Working Well:
- Clear problem statement: Reduce waste + Optimize cuts
- Well-defined user roles
- Realistic offline requirement
- Good balance of features (MVP → advanced)

### Potential Risks:
- **Nesting algorithm complexity** - Recommend starting with Guillotine, upgrade later
- **Real-time updates under load** - Use backend caching + batch operations
- **Data validation** - Dimensions must be validated (negative numbers, overflow)
- **Rollback scenarios** - What if operator clicks "confirm" by mistake?

### Recommendations:
1. **Prototype the nesting algorithm first** (separate PoC)
2. **Involve operators early** for UI/UX feedback
3. **Plan for A/B testing** different algorithm strategies
4. **Start with Docker** even for MVP
5. **Use feature flags** for gradual rollout

---

## 📞 Open Questions for Stakeholders

1. **Rotation**: Can materials be rotated 90° during cutting?
2. **Packaging**: Max/min piece dimensions?
3. **Tolerances**: Acceptable cutting precision (mm)?
4. **Integration**: Must connect to existing ERP?
5. **Mobile**: Needed for barcode scanning initially?
6. **Performance**: Typical daily cut orders (volume)?
7. **Sustainability**: Any specific waste reduction KPI?

---

## 📝 Next Steps

1. **Validate** this analysis with ALBEL stakeholders
2. **Prototype** nesting algorithm (2-3 day sprint)
3. **Setup** development environment (Git, Docker, DB)
4. **Design** database schema (detailed)
5. **Create** technical specification document
6. **Begin** Phase 0 development

---

**Document Status**: Draft - Ready for Stakeholder Review  
**Last Updated**: March 23, 2026  
**Prepared By**: Product Owner Analysis (AI Assistant)
