-- Migrate MaterialChuteThreshold minLengthM to minLengthMm

-- MaterialChuteThresholds table: min_length_m -> min_length_mm
ALTER TABLE material_chute_thresholds ADD COLUMN min_length_mm INTEGER;
UPDATE material_chute_thresholds SET min_length_mm = CAST(CAST(min_length_m * 1000 AS INTEGER) AS INTEGER) WHERE min_length_m IS NOT NULL;
ALTER TABLE material_chute_thresholds DROP COLUMN min_length_m;
