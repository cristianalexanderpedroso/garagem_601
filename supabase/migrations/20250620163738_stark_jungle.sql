/*
  # Adicionar configuração de categorias do estoque

  1. Configurações
    - Adicionar configuração para categorias do estoque
    - Permitir múltiplas categorias separadas por vírgula

  2. Dados Iniciais
    - Inserir categorias padrão baseadas no estoque existente
*/

-- Inserir configuração para categorias do estoque
INSERT INTO configuracoes (chave, valor, tipo, descricao, categoria) 
VALUES (
  'categorias_estoque',
  'Lubrificantes,Filtros,Freios,Suspensão,Motor,Elétrica,Pneus,Manutenção,Diagnóstico,Alinhamento',
  'string',
  'Categorias disponíveis para itens do estoque (separadas por vírgula)',
  'estoque'
) ON CONFLICT (chave) DO UPDATE SET
  valor = EXCLUDED.valor,
  descricao = EXCLUDED.descricao;

-- Inserir outras configurações relacionadas ao estoque
INSERT INTO configuracoes (chave, valor, tipo, descricao, categoria) 
VALUES 
  (
    'alerta_estoque_baixo',
    'true',
    'boolean',
    'Exibir alertas quando itens estiverem com estoque baixo',
    'estoque'
  ),
  (
    'margem_minima_alerta',
    '15',
    'number',
    'Margem mínima de lucro para exibir alerta (%)',
    'estoque'
  )
ON CONFLICT (chave) DO UPDATE SET
  valor = EXCLUDED.valor,
  descricao = EXCLUDED.descricao;