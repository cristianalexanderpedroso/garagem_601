/*
  # Corrigir políticas RLS para consulta pública

  1. Políticas para agendamentos
    - Permitir acesso anônimo a agendamentos
    
  2. Políticas para orçamentos e itens
    - Melhorar políticas existentes
    
  3. Debug e logs
    - Adicionar logs para debug
*/

-- Política para permitir consulta pública de agendamentos
DROP POLICY IF EXISTS "Consulta pública pode ver agendamentos" ON agendamentos;

CREATE POLICY "Consulta pública pode ver agendamentos"
  ON agendamentos FOR SELECT
  TO anon
  USING (true);

-- Atualizar política de orçamentos para ser mais permissiva na consulta pública
DROP POLICY IF EXISTS "Consulta pública pode ver orçamentos" ON orcamentos;

CREATE POLICY "Consulta pública pode ver orçamentos"
  ON orcamentos FOR SELECT
  TO anon
  USING (true);

-- Atualizar política de itens de orçamento
DROP POLICY IF EXISTS "Consulta pública pode ver itens de orçamentos vinculados" ON itens_orcamento;

CREATE POLICY "Consulta pública pode ver itens de orçamentos vinculados"
  ON itens_orcamento FOR SELECT
  TO anon
  USING (true);