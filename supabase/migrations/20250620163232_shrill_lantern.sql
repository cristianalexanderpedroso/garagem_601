/*
  # Adicionar preço de custo ao estoque

  1. Alterações na tabela estoque
    - Adicionar coluna `preco_custo` para armazenar o preço de custo
    - Renomear coluna `preco` para `preco_venda` para clareza
    - Adicionar coluna `tipo` para distinguir entre 'produto' e 'servico'

  2. Migração de dados
    - Manter compatibilidade com dados existentes
    - Definir valores padrão apropriados
*/

-- Adicionar novas colunas à tabela estoque
DO $$
BEGIN
  -- Adicionar coluna preco_custo se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estoque' AND column_name = 'preco_custo'
  ) THEN
    ALTER TABLE estoque ADD COLUMN preco_custo decimal(10,2) DEFAULT 0;
  END IF;

  -- Adicionar coluna tipo se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'estoque' AND column_name = 'tipo'
  ) THEN
    ALTER TABLE estoque ADD COLUMN tipo text DEFAULT 'produto' CHECK (tipo IN ('produto', 'servico'));
  END IF;
END $$;

-- Atualizar registros existentes para ter preço de custo baseado no preço de venda
-- (assumindo uma margem de 30% como exemplo)
UPDATE estoque 
SET preco_custo = ROUND(preco * 0.7, 2)
WHERE preco_custo = 0 AND preco > 0;

-- Adicionar comentários para documentação
COMMENT ON COLUMN estoque.preco IS 'Preço de venda (visível no orçamento final)';
COMMENT ON COLUMN estoque.preco_custo IS 'Preço de custo (visível apenas na seleção do orçamento)';
COMMENT ON COLUMN estoque.tipo IS 'Tipo do item: produto (físico) ou servico (mão de obra)';