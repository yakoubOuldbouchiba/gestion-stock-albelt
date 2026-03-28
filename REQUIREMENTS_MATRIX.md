# 🎯 REQUIREMENTS MATRIX - ALBEL Stock Management

**Date**: March 23, 2026

---

## Quick Reference: Feature Priority & Effort Matrix

```
HIGH EFFORT
    │
    │  [PHASE 2]                [PHASE 1]
    │  • Barcode scanning        • Visualization
    │  • ERP Integration         • Waste management
    │  • Simulation              • Dashboard/Analytics
    │  • ML suggestions          • Audit trail
    │                            • Export (PDF/Excel)
    │
    │  [NICE-TO-HAVE]           [MVP - CRITICAL]
    │  • Multi-site              • Stock data model
    │  • Advanced algorithms     • FIFO logic
    │  • Advanced analytics      • Cutting engine
    │                            • Nesting algorithm
    │                            • User authentication
    └────────────────────────────────────────────────
       LOW PRIORITY    →        HIGH PRIORITY
```

---

## I. FUNCTIONAL REQUIREMENTS (Organized by Module)

### Module 1: Stock Management
| Req ID | Requirement | Priority | Phase | Effort | Status |
|--------|-------------|----------|-------|--------|--------|
| **ST-01** | Store roll data (ID, Material, W/L, Date, Supplier) | **P0** | MVP | 1 day | - |
| **ST-02** | Automatic surface calculation (Width × Length) | **P0** | MVP | 0.5 day | - |
| **ST-03** | Track roll status (Available/Opened/Exhausted) | **P0** | MVP | 1 day | - |
| **ST-04** | Material filtering (PU, PVC, Caoutchouc) | **P0** | MVP | 0.5 day | - |
| **ST-05** | Query stock by date, material, status | **P0** | MVP | 1 day | - |
| **ST-06** | Update inventory after cutting | **P0** | MVP | 2 days | - |
| **ST-07** | Location/zone assignment (optional) | **P2** | Phase 2 | 1 day | - |

### Module 2: FIFO Management
| Req ID | Requirement | Priority | Phase | Effort | Status |
|--------|-------------|----------|-------|--------|--------|
| **FIFO-01** | Sort roll candidates by entry date | **P0** | MVP | 1 day | - |
| **FIFO-02** | Auto-select oldest available roll | **P0** | MVP | 1 day | - |
| **FIFO-03** | Allow manual override (logged) | **P0** | MVP | 1 day | - |
| **FIFO-04** | Alert when overriding FIFO | **P1** | Phase 1 | 0.5 day | - |
| **FIFO-05** | Respect status hierarchy (Available > Opened) | **P0** | MVP | 1 day | - |

### Module 3: Cutting Engine
| Req ID | Requirement | Priority | Phase | Effort | Status |
|--------|-------------|----------|-------|--------|--------|
| **CUT-01** | Accept user input (W, L, Qty, Material) | **P0** | MVP | 1 day | - |
| **CUT-02** | Validate dimensions (positive, within bounds) | **P0** | MVP | 1 day | - |
| **CUT-03** | Check material availability | **P0** | MVP | 1 day | - |
| **CUT-04** | Select best-fit rolls (FIFO) | **P0** | MVP | 2 days | - |
| **CUT-05** | Handle multi-roll cutting if needed | **P0** | MVP | 3 days | - |
| **CUT-06** | Return error if impossible to cut | **P0** | MVP | 1 day | - |
| **CUT-07** | Estimate waste percentage | **P0** | MVP | 1 day | - |
| **CUT-08** | Log all cutting parameters | **P0** | MVP | 1 day | - |

### Module 4: Nesting Algorithm (CORE LOGIC)
| Req ID | Requirement | Priority | Phase | Effort | Status |
|--------|-------------|----------|-------|--------|--------|
| **NEST-01** | Implement Guillotine 2D cutting | **P0** | MVP | 8 days | - |
| **NEST-02** | Calculate piece coordinates (x, y) | **P0** | MVP | 3 days | - |
| **NEST-03** | Calculate waste zones | **P0** | MVP | 2 days | - |
| **NEST-04** | Optimize for 70%+ utilization | **P0** | MVP | 5 days | - |
| **NEST-05** | Return solution in < 2 seconds | **P1** | Phase 1 | 3 days | - |
| **NEST-06** | Support rotation (optional) | **P2** | Phase 2 | 4 days | - |
| **NEST-07** | Implement alternative algorithms (future) | **P2** | Phase 2 | 10 days | - |

### Module 5: Visualization & Graphics
| Req ID | Requirement | Priority | Phase | Effort | Status |
|--------|-------------|----------|-------|--------|--------|
| **VIZ-01** | Draw roll outline (rectangle) | **P1** | Phase 1 | 1 day | - |
| **VIZ-02** | Draw pieces on roll (colored zones) | **P1** | Phase 1 | 2 days | - |
| **VIZ-03** | Draw waste zones (cross-hatched) | **P1** | Phase 1 | 1 day | - |
| **VIZ-04** | Display dimensions on diagram | **P1** | Phase 1 | 1 day | - |
| **VIZ-05** | Label each piece with ID/dimensions | **P1** | Phase 1 | 1 day | - |
| **VIZ-06** | Zoom & pan interactions | **P1** | Phase 1 | 1 day | - |
| **VIZ-07** | Print-friendly layout | **P1** | Phase 1 | 1 day | - |
| **VIZ-08** | SVG export for external tools | **P2** | Phase 2 | 0.5 day | - |

### Module 6: Waste Management
| Req ID | Requirement | Priority | Phase | Effort | Status |
|--------|-------------|----------|-------|--------|--------|
| **WASTE-01** | Generate waste pieces after cutting | **P1** | Phase 1 | 2 days | - |
| **WASTE-02** | Calculate waste dimensions | **P1** | Phase 1 | 1 day | - |
| **WASTE-03** | Classify chute (width < 3000mm) | **P1** | Phase 1 | 0.5 day | - |
| **WASTE-04** | Create new stock entries from waste | **P1** | Phase 1 | 2 days | - |
| **WASTE-05** | Mark chutes as reusable inventory | **P1** | Phase 1 | 1 day | - |
| **WASTE-06** | Visual waste schema | **P1** | Phase 1 | 1 day | - |
| **WASTE-07** | Waste statistics & trends | **P2** | Phase 2 | 2 days | - |

### Module 7: Dashboard & Analytics
| Req ID | Requirement | Priority | Phase | Effort | Status |
|--------|-------------|----------|-------|--------|--------|
| **DASH-01** | Display total stock (m²) | **P1** | Phase 1 | 1 day | - |
| **DASH-02** | Breakdown by material (PU/PVC/Caoutchouc) | **P1** | Phase 1 | 1 day | - |
| **DASH-03** | Show average waste % | **P1** | Phase 1 | 1 day | - |
| **DASH-04** | Count available/opened/exhausted rolls | **P1** | Phase 1 | 1 day | - |
| **DASH-05** | Recent operations feed | **P1** | Phase 1 | 1 day | - |
| **DASH-06** | Top customers by volume | **P2** | Phase 2 | 1 day | - |
| **DASH-07** | Time-series trends (waste, utilization) | **P2** | Phase 2 | 2 days | - |
| **DASH-08** | KPI alerts (low stock, high waste) | **P2** | Phase 2 | 1 day | - |

### Module 8: Historical Tracking & Audit
| Req ID | Requirement | Priority | Phase | Effort | Status |
|--------|-------------|----------|-------|--------|--------|
| **HIST-01** | Log operation timestamp | **P1** | Phase 1 | 0.5 day | - |
| **HIST-02** | Log operator user ID | **P1** | Phase 1 | 0.5 day | - |
| **HIST-03** | Store cutting plan (visual + data) | **P1** | Phase 1 | 1 day | - |
| **HIST-04** | Store source rolls used | **P1** | Phase 1 | 1 day | - |
| **HIST-05** | Store pieces produced | **P1** | Phase 1 | 1 day | - |
| **HIST-06** | Store waste generated | **P1** | Phase 1 | 1 day | - |
| **HIST-07** | Query by date range | **P1** | Phase 1 | 1 day | - |
| **HIST-08** | Query by operator | **P1** | Phase 1 | 1 day | - |
| **HIST-09** | Query by material | **P1** | Phase 1 | 0.5 day | - |
| **HIST-10** | Export history to Excel | **P1** | Phase 1 | 1 day | - |

### Module 9: Export & Reporting
| Req ID | Requirement | Priority | Phase | Effort | Status |
|--------|-------------|----------|-------|--------|--------|
| **EXP-01** | Export cutting plan as PDF | **P1** | Phase 1 | 2 days | - |
| **EXP-02** | Export stock inventory as Excel | **P1** | Phase 1 | 1 day | - |
| **EXP-03** | Export waste report as Excel | **P1** | Phase 1 | 1 day | - |
| **EXP-04** | PDF includes visual diagram | **P1** | Phase 1 | 1 day | - |
| **EXP-05** | PDF includes cutting instructions | **P1** | Phase 1 | 0.5 day | - |
| **EXP-06** | Include footer with operator/date | **P1** | Phase 1 | 0.5 day | - |

### Module 10: User Management & Authentication
| Req ID | Requirement | Priority | Phase | Effort | Status |
|--------|-------------|----------|-------|--------|--------|
| **AUTH-01** | User login (username + password) | **P0** | MVP | 2 days | - |
| **AUTH-02** | Password hashing (bcrypt) | **P0** | MVP | 0.5 day | - |
| **AUTH-03** | Session management (JWT tokens) | **P0** | MVP | 1 day | - |
| **AUTH-04** | Three roles (Admin, Operator, ReadOnly) | **P0** | MVP | 2 days | - |
| **AUTH-05** | Role-based access control (RBAC) | **P0** | MVP | 2 days | - |
| **AUTH-06** | Admin user management (CRUD) | **P0** | MVP | 2 days | - |
| **AUTH-07** | Force password reset on login | **P2** | Phase 2 | 1 day | - |
| **AUTH-08** | Log all access (audit trail) | **P1** | Phase 1 | 1 day | - |

### Module 11: Simulation & Validation (Bonus)
| Req ID | Requirement | Priority | Phase | Effort | Status |
|--------|-------------|----------|-------|--------|--------|
| **SIM-01** | Show cutting plan before confirm | **P2** | Phase 2 | 1 day | - |
| **SIM-02** | Allow user to cancel before execution | **P2** | Phase 2 | 0.5 day | - |
| **SIM-03** | Compare multiple cutting scenarios | **P2** | Phase 2 | 2 days | - |

### Module 12: Barcode Scanning (Bonus)
| Req ID | Requirement | Priority | Phase | Effort | Status |
|--------|-------------|----------|-------|--------|--------|
| **BARCODE-01** | Generate barcode for each roll | **P2** | Phase 2 | 1 day | - |
| **BARCODE-02** | Scan barcode for quick roll selection | **P2** | Phase 2 | 2 days | - |
| **BARCODE-03** | Mobile-friendly barcode interface | **P2** | Phase 2 | 2 days | - |

### Module 13: ERP Integration (Future)
| Req ID | Requirement | Priority | Phase | Effort | Status |
|--------|-------------|----------|-------|--------|--------|
| **ERP-01** | REST API for external systems | **P3** | Phase 3 | 3 days | - |
| **ERP-02** | Receive cutting orders from ERP | **P3** | Phase 3 | 2 days | - |
| **ERP-03** | Push production results to ERP | **P3** | Phase 3 | 2 days | - |
| **ERP-04** | Inventory sync with ERP | **P3** | Phase 3 | 3 days | - |

---

## II. NON-FUNCTIONAL REQUIREMENTS

### Performance
| Req ID | Requirement | Target | Priority |
|--------|-------------|--------|----------|
| **PERF-01** | Nesting calculation | < 2 seconds | **P0** |
| **PERF-02** | UI responsiveness | < 200 ms | **P0** |
| **PERF-03** | Dashboard load time | < 1 second | **P1** |
| **PERF-04** | Support 10,000+ stock items | < 500 ms query | **P1** |
| **PERF-05** | Batch export 1000+ operations | < 10 seconds | **P1** |

### Reliability & Availability
| Req ID | Requirement | Target | Priority |
|--------|-------------|--------|----------|
| **REL-01** | System uptime | 99.5% | **P1** |
| **REL-02** | Data backup frequency | Daily (automated) | **P1** |
| **REL-03** | Recovery time after failure | < 1 hour | **P1** |
| **REL-04** | Concurrent users supported | 50+ operators | **P1** |
| **REL-05** | Database consistency | Transactional ACID | **P0** |

### Security
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| **SEC-01** | Encrypt passwords (bcrypt) | **P0** |
| **SEC-02** | Encrypted database connections | **P0** |
| **SEC-03** | Audit trail for all operations | **P1** |
| **SEC-04** | Role-based access control | **P0** |
| **SEC-05** | No plaintext credentials in logs | **P0** |
| **SEC-06** | Input validation (SQL injection prevention) | **P0** |

### Scalability & Maintenance
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| **SCALE-01** | Modular architecture (easy updates) | **P1** |
| **SCALE-02** | Docker containerization | **P1** |
| **SCALE-03** | Support multi-warehouse (future) | **P3** |
| **SCALE-04** | API versioning for integrations | **P2** |

### Deployment & Operations
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| **OPS-01** | Local deployment only (no cloud) | **P0** |
| **OPS-02** | Works offline (local data storage) | **P0** |
| **OPS-03** | Docker Compose for easy setup | **P0** |
| **OPS-04** | Single machine or multi-server support | **P1** |
| **OPS-05** | Database backup utilities | **P1** |

### Usability
| Req ID | Requirement | Priority |
|--------|-------------|----------|
| **UX-01** | Intuitive UI (factory operators) | **P0** |
| **UX-02** | Minimal training required | **P0** |
| **UX-03** | Keyboard shortcuts for power users | **P2** |
| **UX-04** | Mobile-responsive design | **P2** |
| **UX-05** | Support French & English | **P2** |

---

## III. EFFORT ESTIMATION SUMMARY

| Category | Tasks | Estimated Hours |
|----------|-------|-----------------|
| **Database & Backend Setup** | 5 | 40 h |
| **Stock Module** | 7 | 56 h |
| **FIFO Logic** | 5 | 40 h |
| **Cutting Engine** | 8 | 64 h |
| **Nesting Algorithm (Guillotine)** | 7 | **112 h** ← CRITICAL |
| **Frontend (React) Scaffolding** | 5 | 40 h |
| **Visualization & Graphics** | 8 | 72 h |
| **Waste Management** | 7 | 56 h |
| **Dashboard & Analytics** | 8 | 64 h |
| **Historical Tracking** | 10 | 80 h |
| **Export (PDF/Excel)** | 6 | 48 h |
| **Authentication & User Mgmt** | 8 | 64 h |
| **Testing & QA** | - | 120 h |
| **Documentation** | - | 40 h |
| **Deployment & Docker** | - | 40 h |
| **Contingency (15%)** | - | 144 h |
| **TOTAL (MVP + Phase 1)** | | **~1000 hours** |

**Recommended Team**: 2-3 Backend + 2 Frontend + 1 QA + 1 QA Lead  
**Timeline**: 6 months at 40 hrs/week

### Cost Estimation (Algerian Market)

| Phase | Hours | Rate/Hour | Total Cost |
|-------|-------|-----------|-----------|
| **MVP** | 500 | 1,500 DA | 750,000 DA |
| **Phase 1** | 400 | 1,500 DA | 600,000 DA |
| **Phase 2** | 150 | 1,500 DA | 225,000 DA |
| **Infrastructure** | - | - | 1,250,000-1,400,000 DA |
| **TOTAL** | 1,050 | - | **2,825,000-2,975,000 DA** |

**Equivalent**: ~11,000 USD / ~10,500 EUR at 1 EUR = 145-150 DZD

---

## IV. Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Nesting algorithm complexity | High | Medium | Start with PoC, involve specialists |
| Performance degradation at scale | High | Medium | Early load testing, caching layer |
| Data validation issues | High | Low | Comprehensive input validation |
| User adoption resistance | Medium | Medium | Involve operators in design early |
| Database lock contention | Medium | Low | Query optimization, connection pooling |
| Scope creep (integrations) | Medium | High | Strict MVP boundaries |

---

## V. Success Acceptance Criteria

- ✅ MVP delivers 70%+ cutting utilization
- ✅ Cutting calculation < 2 seconds for standard orders
- ✅ FIFO respected in 100% of operations
- ✅ Waste tracking accuracy > 98%
- ✅ < 5 minutes operator training per feature
- ✅ System runs on local intranet without cloud
- ✅ Historical data preserved for 3+ years

---

**This matrix is ready for:**
- Development sprint planning
- Stakeholder communication
- Budget estimation
- Resource allocation
- Risk management

