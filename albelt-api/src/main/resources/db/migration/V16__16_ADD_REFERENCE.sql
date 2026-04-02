-- Add reference column to rolls
ALTER TABLE rolls
    ADD COLUMN reference VARCHAR(100);

-- Add reference column to waste_pieces
ALTER TABLE waste_pieces
    ADD COLUMN reference VARCHAR(100);


UPDATE rolls
SET reference = md5(random()::text);


update waste_pieces
SET reference = (select reference from rolls r where r.id  = roll_id)