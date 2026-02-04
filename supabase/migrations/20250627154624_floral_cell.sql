-- Inserir configurações de horário de funcionamento
INSERT INTO configuracoes (chave, valor, tipo, descricao, categoria) 
VALUES 
  (
    'horario_funcionamento_texto',
    'Segunda a Sexta das 8h às 18h, Sábado das 8h às 12h',
    'string',
    'Texto descritivo do horário de funcionamento para exibição pública',
    'geral'
  ),
  (
    'horario_sabado_inicio',
    '08:00',
    'string',
    'Horário de início do funcionamento aos sábados',
    'calendario'
  ),
  (
    'horario_sabado_fim',
    '12:00',
    'string',
    'Horário de fim do funcionamento aos sábados',
    'calendario'
  ),
  (
    'funcionamento_sabado',
    'true',
    'boolean',
    'Se a oficina funciona aos sábados',
    'calendario'
  ),
  (
    'funcionamento_domingo',
    'false',
    'boolean',
    'Se a oficina funciona aos domingos',
    'calendario'
  )
ON CONFLICT (chave) DO UPDATE SET
  valor = EXCLUDED.valor,
  descricao = EXCLUDED.descricao;