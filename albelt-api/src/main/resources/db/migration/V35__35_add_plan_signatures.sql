ALTER TABLE optimization_plans
    ADD COLUMN IF NOT EXISTS input_signature VARCHAR (128),
    ADD COLUMN IF NOT EXISTS stock_signature VARCHAR (128);

CREATE INDEX IF NOT EXISTS idx_optimization_plans_item_signature
    ON optimization_plans (commande_item_id, status, algorithm_version, input_signature, stock_signature);
