/*
  # Add desconto_geral column to orcamentos table

  1. Changes
    - Add `desconto_geral` column to `orcamentos` table
    - Column type: numeric(5,2) with default value 0
    - Allows storing percentage discounts (0-100%)

  2. Security
    - No changes to RLS policies needed
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orcamentos' AND column_name = 'desconto_geral'
  ) THEN
    ALTER TABLE orcamentos ADD COLUMN desconto_geral numeric(5,2) DEFAULT 0;
  END IF;
END $$;