/*
  # Atualizar políticas para consulta pública de orçamentos

  1. Alterações
    - Adiciona índice para otimização de consultas
    - Atualiza política de consulta pública para orçamentos vinculados a agendamentos
    - Adiciona política para itens de orçamentos vinculados

  2. Segurança
    - Permite acesso anônimo apenas a orçamentos vinculados a agendamentos
    - Permite acesso anônimo aos itens desses orçamentos
*/

-- Adicionar índice para otimização se não existir
CREATE INDEX IF NOT EXISTS idx_agendamentos_orcamento_id ON agendamentos(orcamento_id);

-- Atualizar a política de consulta pública para orçamentos
-- Permitir que usuários anônimos vejam orçamentos vinculados a agendamentos
DROP POLICY IF EXISTS "Consulta pública pode ver orçamentos" ON orcamentos;

CREATE POLICY "Consulta pública pode ver orçamentos"
  ON orcamentos FOR SELECT
  TO anon
  USING (
    -- Permitir acesso a orçamentos que estão vinculados a agendamentos
    EXISTS (
      SELECT 1 FROM agendamentos 
      WHERE agendamentos.orcamento_id = orcamentos.id
    )
  );

-- Remover política existente se houver
DROP POLICY IF EXISTS "Consulta pública pode ver itens de orçamentos vinculados" ON itens_orcamento;

-- Política para permitir que usuários anônimos vejam itens de orçamentos vinculados
CREATE POLICY "Consulta pública pode ver itens de orçamentos vinculados"
  ON itens_orcamento FOR SELECT
  TO anon
  USING (
    -- Permitir acesso a itens de orçamentos que estão vinculados a agendamentos
    EXISTS (
      SELECT 1 FROM orcamentos o
      JOIN agendamentos a ON a.orcamento_id = o.id
      WHERE o.id = itens_orcamento.orcamento_id
    )
  );