-- Remove SVG column from optimization_plans table
-- SVG is now generated on-demand by the frontend to reduce database storage

ALTER TABLE optimization_plans
DROP COLUMN IF EXISTS svg;
