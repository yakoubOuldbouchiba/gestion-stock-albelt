-- Add color_id column to articles table
ALTER TABLE articles
    ADD COLUMN IF NOT EXISTS color_id UUID;

-- Add foreign key constraint
DO
$$
BEGIN
    IF
NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_articles_color') THEN
ALTER TABLE articles
    ADD CONSTRAINT fk_articles_color
        FOREIGN KEY (color_id) REFERENCES colors (id)
            ON DELETE SET NULL;
END IF;
END $$;

-- Add index for color_id
CREATE INDEX IF NOT EXISTS idx_articles_color_id ON articles(color_id);
