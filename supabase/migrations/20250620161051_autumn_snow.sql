/*
  # Sistema de Status para Agendamentos

  1. Alterações
    - Atualiza os status possíveis para agendamentos
    - Adiciona novos status específicos do processo de manutenção
    - Mantém compatibilidade com dados existentes

  2. Novos Status
    - aguardando_inicio: Aguardando Início
    - em_analise: Em Análise  
    - aguardando_aprovacao: Aguardando Aprovação do Orçamento
    - em_preparacao: Em Preparação
    - aguardando_pecas: Aguardando Peças
    - no_elevador: No Elevador
    - em_manutencao: Em Manutenção
    - concluido: Concluído
*/

-- Remover a constraint de status existente
ALTER TABLE agendamentos DROP CONSTRAINT IF EXISTS agendamentos_status_check;

-- Adicionar nova constraint com os novos status
ALTER TABLE agendamentos ADD CONSTRAINT agendamentos_status_check 
CHECK (status IN (
  'aguardando_inicio',
  'em_analise', 
  'aguardando_aprovacao',
  'em_preparacao',
  'aguardando_pecas',
  'no_elevador',
  'em_manutencao',
  'concluido',
  -- Manter status antigos para compatibilidade
  'agendado',
  'em_andamento',
  'cancelado'
));

-- Atualizar status antigos para novos equivalentes
UPDATE agendamentos 
SET status = CASE 
  WHEN status = 'agendado' THEN 'aguardando_inicio'
  WHEN status = 'em_andamento' THEN 'em_manutencao'
  ELSE status
END
WHERE status IN ('agendado', 'em_andamento');

-- Alterar valor padrão para o novo status inicial
ALTER TABLE agendamentos ALTER COLUMN status SET DEFAULT 'aguardando_inicio';