# Migration Archive

This folder contains all legacy migration files (V1-V22) from active development.

**Status:** These migrations have already been executed on the production database and will NOT be re-executed by
Flyway (Flyway tracks migrations by version number).

## Files in this Archive

| Version | Original File                                        | Purpose                                   |
|---------|------------------------------------------------------|-------------------------------------------|
| V1      | V1__create_core_tables.sql                           | Core tables (users, suppliers, rolls)     |
| V2      | V2__create_transaction_tables.sql                    | Cutting operations & waste pieces         |
| V3      | V3__create_indexes.sql                               | Initial indexes                           |
| V4      | V4__create_triggers.sql                              | Triggers & functions                      |
| V5      | V5__insert_sample_data.sql                           | Sample data (from V5_duplicate below)     |
| V6      | V6__create_altier_table.sql                          | Altier reference verification             |
| V7      | V7__remove_location_add_altier.sql                   | Schema cleanup - location removal         |
| V8      | V8__add_missing_users_if_needed.sql                  | User management fix                       |
| V9      | V9__create_user_altier_mapping.sql                   | User-workshop mapping                     |
| V10     | V10__create_roll_movements_table.sql                 | Roll movement tracking                    |
| V11     | V11__add_primary_altier_to_users.sql                 | User primary location                     |
| V12     | V12__create_transfer_bons_table.sql                  | Transfer document tracking                |
| V13     | V13__create_material_chute_thresholds_table.sql      | Waste classification options              |
| V14     | V14__simplify_material_chute_thresholds_min_only.sql | Threshold simplification                  |
| V15     | V15__create_clients_table.sql                        | Client & contact tables                   |
| V16     | V16__insert_sample_clients.sql                       | Sample client data                        |
| V17     | V17__create_commandes_table.sql                      | Orders system structure                   |
| V18     | V18__enhance_cutting_workflow.sql                    | Cutting workflow additions                |
| V19     | V19__insert_commandes_sample_data.sql                | Sample order data                         |
| V20     | V20__fix_missing_columns.sql                         | Schema patches - missing columns          |
| V21     | V21__fix_cutting_workflow_columns.sql                | Schema patches - workflow columns         |
| V22     | V22__simplify_cutting_workflow.sql                   | Schema cleanup - CuttingOperation removal |

## Why These Were Messy

- **Multiple patches (V14, V20-V22):** Schema corrections after initial creation
- **Redundant creation/modification:** Some tables created then altered multiple times
- **Conflicting structures:** Location vs. altier_id confusion in rolls table
- **Incremental discoveries:** Features added one at a time instead of holistically

## How We Improved

The new **V1-V8 clean structure** consolidates all functionality:

- ✅ **V1:** All core tables created correctly first time
- ✅ **V2:** All inventory tables
- ✅ **V3:** All order tables
- ✅ **V4:** All tracking & mapping
- ✅ **V5:** All configuration
- ✅ **V6:** All indexes (optimized)
- ✅ **V7:** All triggers & functions
- ✅ **V8:** All sample data

## Reference

Archive files are saved as-is for historical reference and troubleshooting. They demonstrate the evolution of the system
during active development.
