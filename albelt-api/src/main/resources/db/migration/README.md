# Clean Migration Structure

**Date Restructured:** 2026-03-27

All database migrations have been reorganized from a messy 22-file structure into a clean, logical 8-file framework.

## 📁 What's Here

```
migration/
├── 00_archive/                    # Original V1-V22 (kept for reference)
├── 01_core/                       # V1: Core tables
├── 02_inventory/                  # V2: Inventory tables  
├── 03_orders/                     # V3: Order system
├── 04_tracking/                   # V4: Stock tracking
├── 05_configuration/              # V5: Configuration tables
├── 06_indexes/                    # V6: Performance indexes
├── 07_functions/                  # V7: Triggers & functions
├── 08_sample_data/                # V8: Sample data
└── README.md                      # This file
```

##  ✨ What Changed

### Before (22 Messy Files)
- V1-V5: Initial schema + repeats
- V6-V9: Altier & user mapping confusion
- V10-V14: Roll movements + config patches
- V15-V16: Clients management (scattered)
- V17-V19: Orders system (incomplete)
- V20-V22: **Patches to fix broken migrations**

### After (8 Clean Files)
- **V1:** Users, Suppliers, Altiers
- **V2:** Rolls, Waste Pieces
- **V3:** Clients, Commandes, Items + Audit
- **V4:** User-Altier, Roll Movements, Transfer Bons
- **V5:** Configuration (Material Thresholds)
- **V6:** All 30+ indexes (optimized)
- **V7:** All triggers & functions
- **V8:** Sample data

## 🔧 Migration Notes

All files use `CREATE TABLE IF NOT EXISTS` to support:
- ✅ Fresh database builds
- ✅ Running against existing database
- ✅ Idempotent (safe to re-run)

## 📊 Table Overview

| Phase | Tables | Purpose |
|-------|--------|---------|
| V1 | users, suppliers, altier | Core infrastructure |
| V2 | rolls, waste_pieces | Stock inventory |
| V3 | clients, commandes, items + audit | Order management |
| V4 | user_altier, roll_movements, transfer_bons | Tracking |
| V5 | material_chute_thresholds | Configuration |
| V6 | (30+ indexes) | Performance |
| V7 | (triggers/functions) | Automation |
| V8 | (sample data) | Development |

## 📝 Key Features

✅ **FIFO Optimization:** idx_rolls_fifo_selection for quick stock selection  
✅ **Waste Reuse:** idx_waste_pieces_reuse_selection for finding reusable materials  
✅ **Auto-timestamps:** Triggers maintain updated_at automatically  
✅ **Foreign keys:** Proper ON DELETE CASCADE/RESTRICT rules  
✅ **Validation:** CHECK constraints on all critical fields  

## 🚀 Usage

**For new database:**
- Flyway automatically runs V1→V8 in order
- All sample data is created
- Ready for development

**For existing database:**
- Old migrations (V1-V22) won't re-run (Flyway has history)
- New clean structure is reference documentation
- Database schema already matches

## 📌 Important

- ✅ **Archive folder (00_archive/):** Kept for historical reference only, won't interfere with Flyway
- ✅ **Backward compatible:** Existing database unaffected
- ✅ **Idempotent:** All CREATE/ALTER statements safe to re-run
- ✅ **Documented:** Every table/column has clear comments

---

**Restructured by:** Development Team  
**Date:** 2026-03-27  
**Status:** Production Ready
