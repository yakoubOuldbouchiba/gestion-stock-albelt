-- V9: Fix original_quantity column type from VARCHAR to INTEGER
-- Issue: Hibernate schema validation expects INTEGER but found VARCHAR
-- Solution: Alter the rolls table to change original_quantity to INTEGER type

DO $$
BEGIN
    -- Check if the column still has VARCHAR type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'rolls'
        AND column_name = 'original_quantity'
        AND data_type = 'character varying'
    ) THEN
        -- Drop any existing constraint or index that references this column
        -- (None typically reference this column, but being safe)
        
        -- Convert column type from VARCHAR(20) to INTEGER
        -- Cast existing values to integer, treating non-numeric values as NULL
        ALTER TABLE rolls
        ALTER COLUMN original_quantity TYPE INTEGER USING (
            CASE 
                WHEN original_quantity ~ '^\d+$' THEN CAST(original_quantity AS INTEGER)
                ELSE NULL
            END
        );
        
        RAISE NOTICE 'Successfully converted original_quantity from VARCHAR to INTEGER';
    ELSE
        RAISE NOTICE 'Column original_quantity is already type INTEGER or does not exist';
    END IF;
END $$;
