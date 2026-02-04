/*
  # Adicionar campo KM de entrada aos veículos

  1. Alterações
    - Adiciona coluna `km_entrada` na tabela `veiculos`
    - Campo opcional para registrar a quilometragem na entrada do veículo
*/

-- Adicionar coluna km_entrada à tabela veiculos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'veiculos' AND column_name = 'km_entrada'
  ) THEN
    ALTER TABLE veiculos ADD COLUMN km_entrada integer;
  END IF;
END $$;