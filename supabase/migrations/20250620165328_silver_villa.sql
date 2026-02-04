/*
  # Configurações da Oficina e Categorias de Serviços

  1. Novas Configurações
    - CNPJ da oficina
    - Logo da oficina (URL)
    - Categorias de serviços configuráveis
    
  2. Organização
    - Categorias organizadas por seção
    - Valores padrão apropriados
*/

-- Inserir configurações da oficina
INSERT INTO configuracoes (chave, valor, tipo, descricao, categoria) 
VALUES 
  (
    'cnpj_oficina',
    '',
    'string',
    'CNPJ da oficina (formato: 00.000.000/0000-00)',
    'geral'
  ),
  (
    'logo_oficina',
    '',
    'string',
    'URL da logo da oficina (imagem)',
    'geral'
  ),
  (
    'razao_social',
    '',
    'string',
    'Razão social da empresa',
    'geral'
  ),
  (
    'inscricao_estadual',
    '',
    'string',
    'Inscrição estadual da empresa',
    'geral'
  )
ON CONFLICT (chave) DO UPDATE SET
  descricao = EXCLUDED.descricao;

-- Atualizar configuração de categorias de serviços se não existir
INSERT INTO configuracoes (chave, valor, tipo, descricao, categoria) 
VALUES (
  'categorias_servicos',
  'Manutenção Preventiva,Manutenção Corretiva,Diagnóstico,Alinhamento e Balanceamento,Troca de Óleo,Sistema de Freios,Suspensão,Motor,Sistema Elétrico,Ar Condicionado,Revisão Geral,Embreagem,Direção,Pneus e Rodas',
  'string',
  'Categorias disponíveis para serviços (separadas por vírgula)',
  'servicos'
) ON CONFLICT (chave) DO UPDATE SET
  valor = EXCLUDED.valor,
  descricao = EXCLUDED.descricao;

-- Inserir configurações adicionais para serviços
INSERT INTO configuracoes (chave, valor, tipo, descricao, categoria) 
VALUES 
  (
    'tempo_garantia_servicos',
    '90',
    'number',
    'Tempo de garantia padrão para serviços (dias)',
    'servicos'
  ),
  (
    'desconto_maximo_servicos',
    '20',
    'number',
    'Desconto máximo permitido em serviços (%)',
    'servicos'
  )
ON CONFLICT (chave) DO UPDATE SET
  valor = EXCLUDED.valor,
  descricao = EXCLUDED.descricao;