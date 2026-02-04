/*
  # Adicionar campo de imagem aos veículos

  1. Alterações
    - Adiciona coluna `imagem_url` na tabela `veiculos`
    - Campo opcional para armazenar URL da imagem do veículo
    - Remove obrigatoriedade do campo chassi
*/

-- Adicionar coluna imagem_url à tabela veiculos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'veiculos' AND column_name = 'imagem_url'
  ) THEN
    ALTER TABLE veiculos ADD COLUMN imagem_url text;
  END IF;
END $$;

-- Tornar o campo chassi não obrigatório (remover NOT NULL constraint)
DO $$
BEGIN
  -- Primeiro, remover a constraint UNIQUE se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'veiculos' AND constraint_name = 'veiculos_chassi_key'
  ) THEN
    ALTER TABLE veiculos DROP CONSTRAINT veiculos_chassi_key;
  END IF;
  
  -- Alterar a coluna para permitir NULL
  ALTER TABLE veiculos ALTER COLUMN chassi DROP NOT NULL;
  
  -- Recriar a constraint UNIQUE permitindo valores NULL
  -- (PostgreSQL permite múltiplos NULLs em campos UNIQUE)
  ALTER TABLE veiculos ADD CONSTRAINT veiculos_chassi_key UNIQUE (chassi);
END $$;