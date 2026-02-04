/*
  # Adicionar seção de serviços

  1. Modificações na tabela estoque
    - Adicionar comentários para clarificar o uso dos campos
    - Garantir que o tipo 'servico' está funcionando corretamente

  2. Configurações
    - Adicionar configurações específicas para serviços
    - Categorias padrão para serviços

  3. Índices
    - Otimizar consultas por tipo de item
*/

-- Adicionar comentários na tabela estoque para clarificar uso
COMMENT ON COLUMN estoque.preco IS 'Preço de venda (visível no orçamento final)';
COMMENT ON COLUMN estoque.preco_custo IS 'Preço de custo (visível apenas na seleção do orçamento)';
COMMENT ON COLUMN estoque.tipo IS 'Tipo do item: produto (físico) ou servico (mão de obra)';

-- Adicionar índice para otimizar consultas por tipo
CREATE INDEX IF NOT EXISTS idx_estoque_tipo ON estoque(tipo);

-- Inserir configurações específicas para serviços
INSERT INTO configuracoes (chave, valor, tipo, descricao, categoria) 
VALUES 
  (
    'categorias_servicos',
    'Manutenção Preventiva,Manutenção Corretiva,Diagnóstico,Alinhamento e Balanceamento,Troca de Óleo,Sistema de Freios,Suspensão,Motor,Sistema Elétrico,Ar Condicionado',
    'string',
    'Categorias disponíveis para serviços (separadas por vírgula)',
    'servicos'
  ),
  (
    'margem_padrao_servicos',
    '100',
    'number',
    'Margem padrão para serviços (%)',
    'servicos'
  ),
  (
    'tempo_padrao_servico',
    '60',
    'number',
    'Tempo padrão para execução de serviços (minutos)',
    'servicos'
  )
ON CONFLICT (chave) DO UPDATE SET
  valor = EXCLUDED.valor,
  descricao = EXCLUDED.descricao;

-- Inserir alguns serviços padrão se não existirem
INSERT INTO estoque (nome, categoria, preco, preco_custo, quantidade, quantidade_minima, fornecedor, tipo)
SELECT 
  nome,
  categoria,
  preco,
  preco_custo,
  0, -- Serviços não têm quantidade física
  0, -- Serviços não têm quantidade mínima
  'Interno',
  'servico'
FROM (
  VALUES 
    ('Troca de Óleo e Filtro', 'Manutenção Preventiva', 80.00, 40.00),
    ('Alinhamento', 'Alinhamento e Balanceamento', 60.00, 30.00),
    ('Balanceamento', 'Alinhamento e Balanceamento', 40.00, 20.00),
    ('Diagnóstico Eletrônico', 'Diagnóstico', 100.00, 50.00),
    ('Troca de Pastilhas de Freio', 'Sistema de Freios', 120.00, 60.00),
    ('Revisão Geral', 'Manutenção Preventiva', 200.00, 100.00)
) AS servicos_padrao(nome, categoria, preco, preco_custo)
WHERE NOT EXISTS (
  SELECT 1 FROM estoque 
  WHERE estoque.nome = servicos_padrao.nome 
  AND estoque.tipo = 'servico'
);