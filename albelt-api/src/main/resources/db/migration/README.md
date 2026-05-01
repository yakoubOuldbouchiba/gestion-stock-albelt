# Clean Migration Structure

**Date Restructured:** 2026-03-28

All database migrations have been reorganized into a clean, flat V1-V13 sequence.

## 📁 What's Here

```
migration/
├── V1__00_CREATE_CORE_TABLES.sql
├── V2__01_CREATE_INVENTORY_TABLES.sql
├── V3__02_CREATE_ORDERS_TABLES.sql
├── V4__03_CREATE_STOCK_TRACKING.sql
├── V5__04_CREATE_CONFIGURATION.sql
├── V6__05_CREATE_INDEXES.sql
├── V7__06_CREATE_TRIGGERS_AND_FUNCTIONS.sql
├── V8__07_INSERT_SAMPLE_DATA.sql
├── V9__09_UPDATE_USER_PASSWORDS.sql
├── V10__10_FIX_ROLLS_ORIGINAL_QUANTITY_TYPE.sql
├── V11__11_DEFAULT_ROLLS_WASTE_TYPE.sql
├── V12__12_INSERT_SAMPLE_CHUTE_DATA.sql
├── V13__13_UPDATE_WASTE_PIECES_STATUS_CHECK.sql
└── README.md
```

## ✨ What Changed

### After (13 Clean Files)

- **V1:** Users, Suppliers, Altiers
- **V2:** Rolls, Waste Pieces + validation triggers
- **V3:** Clients, Commandes, Items + Audit
- **V4:** User-Altier, Roll Movements, Transfer Bons
- **V5:** Configuration (Material Thresholds)
- **V6:** All 30+ indexes (optimized)
- **V7:** All triggers & functions
- **V8:** Sample data
- **V9:** User password hash fixes
- **V10:** Roll original_quantity type fix
- **V11:** Waste type defaults for waste_pieces
- **V12:** Sample chute rolls
- **V13:** Waste status check constraint

## 🔧 Migration Notes

All files use `CREATE TABLE IF NOT EXISTS` to support:

- ✅ Fresh database builds
- ✅ Running against existing database
- ✅ Idempotent (safe to re-run)

## 📊 Table Overview

| Phase | Tables                                     | Purpose             |
|-------|--------------------------------------------|---------------------|
| V1    | users, suppliers, altier                   | Core infrastructure |
| V2    | rolls, waste_pieces                        | Stock inventory     |
| V3    | clients, commandes, items + audit          | Order management    |
| V4    | user_altier, roll_movements, transfer_bons | Tracking            |
| V5    | material_chute_thresholds                  | Configuration       |
| V6    | (30+ indexes)                              | Performance         |
| V7    | (triggers/functions)                       | Automation          |
| V8    | (sample data)                              | Development         |
| V9    | users                                      | Password fix        |
| V10   | rolls                                      | Column type fix     |
| V11   | waste_pieces                               | Defaults            |
| V12   | rolls                                      | Sample data         |
| V13   | waste_pieces                               | Check constraints   |

## 📝 Key Features

✅ **FIFO Optimization:** idx_rolls_fifo_selection for quick stock selection  
✅ **Waste Reuse:** idx_waste_pieces_reuse_selection for finding reusable materials  
✅ **Auto-timestamps:** Triggers maintain updated_at automatically  
✅ **Foreign keys:** Proper ON DELETE CASCADE/RESTRICT rules  
✅ **Validation:** CHECK constraints on all critical fields

## 🚀 Usage

**For new database:**

- Flyway automatically runs V1→V13 in order
- Sample data is created
- Ready for development

**For existing database:**

- Flyway will apply the new sequence in order
- Ensure your Flyway history is reset if you want a clean rebuild

## 📌 Important

- ✅ **Flat structure:** Single sequence for clarity
- ✅ **Idempotent:** All CREATE/ALTER statements safe to re-run
- ✅ **Documented:** Every table/column has clear comments

---

**Restructured by:** Development Team  
**Date:** 2026-03-27  
**Status:** Production Ready
