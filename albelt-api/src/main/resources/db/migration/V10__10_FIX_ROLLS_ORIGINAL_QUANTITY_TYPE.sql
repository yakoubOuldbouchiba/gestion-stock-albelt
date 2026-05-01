-- ============================================================================
-- V10: Fix original_quantity column type in rolls table
-- ============================================================================
-- Issue: original_quantity was created as VARCHAR(20) in V1, but the Roll JPA 
-- entity expects INTEGER type. Hibernate schema validation fails with:
-- "wrong column type encountered in column [original_quantity] in table [rolls]; 
-- found [varchar (Types#VARCHAR)], but expecting [integer (Types#INTEGER)]"
--
-- Solution: Convert the column from VARCHAR(20) to INTEGER, cast existing values
-- ============================================================================

DO
$$
BEGIN
    -- Check if the column still has VARCHAR type
    IF
EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'rolls'
        AND column_name = 'original_quantity'
        AND data_type = 'character varying'
    ) THEN
        -- Convert column type from VARCHAR(20) to INTEGER
        -- Cast existing values to integer, treating non-numeric values as NULL
ALTER TABLE rolls
ALTER
COLUMN original_quantity TYPE INTEGER USING (
            CASE 
                WHEN original_quantity ~ '^\d+$' THEN CAST(original_quantity AS INTEGER)
                ELSE NULL
            END
        );
        
        RAISE
NOTICE 'Successfully converted original_quantity from VARCHAR to INTEGER';
ELSE
        RAISE NOTICE 'Column original_quantity is already type INTEGER or does not exist';
END IF;
END $$;
