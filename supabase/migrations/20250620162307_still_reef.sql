/*
  # Adicionar status "Aguardando Retirada do Veículo"

  1. Alterações
    - Adiciona o novo status 'aguardando_retirada' à constraint de status dos agendamentos
    - Este status será usado quando o serviço estiver concluído mas o veículo ainda não foi retirado
*/

-- Remover a constraint de status existente
ALTER TABLE agendamentos DROP CONSTRAINT IF EXISTS agendamentos_status_check;

-- Adicionar nova constraint com o status adicional
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
  'aguardando_retirada',
  -- Manter status antigos para compatibilidade
  'agendado',
  'em_andamento',
  'cancelado'
));