/*
  # Adicionar vinculação de agendamento aos orçamentos

  1. Alterações
    - Adicionar coluna `agendamento_id` na tabela `orcamentos`
    - Permitir vinculação opcional entre orçamentos e agendamentos
    - Atualizar políticas para consulta pública baseada em agendamentos vinculados

  2. Índices
    - Adicionar índice para otimização de consultas
*/

-- Adicionar coluna agendamento_id à tabela orcamentos se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orcamentos' AND column_name = 'agendamento_id'
  ) THEN
    ALTER TABLE orcamentos ADD COLUMN agendamento_id uuid REFERENCES agendamentos(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Adicionar índice para otimização
CREATE INDEX IF NOT EXISTS idx_orcamentos_agendamento_id ON orcamentos(agendamento_id);

-- Atualizar a política de consulta pública para orçamentos
-- Permitir que usuários anônimos vejam orçamentos vinculados a agendamentos
DROP POLICY IF EXISTS "Consulta pública pode ver orçamentos" ON orcamentos;

CREATE POLICY "Consulta pública pode ver orçamentos"
  ON orcamentos FOR SELECT
  TO anon
  USING (
    -- Permitir acesso a orçamentos que estão vinculados a agendamentos
    agendamento_id IS NOT NULL
  );

-- Atualizar política para itens de orçamentos vinculados
DROP POLICY IF EXISTS "Consulta pública pode ver itens de orçamentos vinculados" ON itens_orcamento;

CREATE POLICY "Consulta pública pode ver itens de orçamentos vinculados"
  ON itens_orcamento FOR SELECT
  TO anon
  USING (
    -- Permitir acesso a itens de orçamentos que estão vinculados a agendamentos
    EXISTS (
      SELECT 1 FROM orcamentos o
      WHERE o.id = itens_orcamento.orcamento_id
      AND o.agendamento_id IS NOT NULL
    )
  );