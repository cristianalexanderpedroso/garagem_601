/*
  # Adicionar status "pago" e data de pagamento aos orçamentos

  1. Alterações na tabela orcamentos
    - Adicionar status "pago" às opções existentes
    - Adicionar coluna data_pagamento para registrar quando foi pago

  2. Índices
    - Adicionar índice para data_pagamento para otimizar consultas por mês
*/

-- Remover constraint de status existente
ALTER TABLE orcamentos DROP CONSTRAINT IF EXISTS orcamentos_status_check;

-- Adicionar nova constraint com status "pago"
ALTER TABLE orcamentos ADD CONSTRAINT orcamentos_status_check 
CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'em_andamento', 'concluido', 'pago'));

-- Adicionar coluna data_pagamento
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orcamentos' AND column_name = 'data_pagamento'
  ) THEN
    ALTER TABLE orcamentos ADD COLUMN data_pagamento date;
  END IF;
END $$;

-- Adicionar índice para otimizar consultas por data de pagamento
CREATE INDEX IF NOT EXISTS idx_orcamentos_data_pagamento ON orcamentos(data_pagamento);

-- Comentário na coluna
COMMENT ON COLUMN orcamentos.data_pagamento IS 'Data em que o orçamento foi pago pelo cliente';