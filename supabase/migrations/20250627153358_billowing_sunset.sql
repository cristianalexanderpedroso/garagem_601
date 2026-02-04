-- Script de debug para verificar dados da consulta pública
-- Execute este script no SQL Editor do Supabase para verificar os dados

-- 1. Verificar veículos cadastrados
SELECT 
  v.id,
  v.placa,
  v.marca,
  v.modelo,
  c.nome as cliente_nome
FROM veiculos v
JOIN clientes c ON c.id = v.cliente_id
ORDER BY v.created_at DESC;

-- 2. Verificar agendamentos
SELECT 
  a.id,
  a.titulo,
  a.status,
  a.data_inicio,
  a.data_fim,
  v.placa,
  c.nome as cliente_nome
FROM agendamentos a
JOIN veiculos v ON v.id = a.veiculo_id
JOIN clientes c ON c.id = a.cliente_id
ORDER BY a.data_inicio DESC;

-- 3. Verificar orçamentos
SELECT 
  o.id,
  o.numero_orcamento,
  o.status,
  o.agendamento_id,
  v.placa,
  c.nome as cliente_nome
FROM orcamentos o
JOIN veiculos v ON v.id = o.veiculo_id
JOIN clientes c ON c.id = o.cliente_id
ORDER BY o.created_at DESC;

-- 4. Verificar dados específicos do cliente Cristian
SELECT 
  'CLIENTE' as tipo,
  c.id,
  c.nome,
  NULL as placa,
  NULL as status
FROM clientes c
WHERE LOWER(c.nome) LIKE '%cristian%'

UNION ALL

SELECT 
  'VEICULO' as tipo,
  v.id,
  c.nome as cliente_nome,
  v.placa,
  NULL as status
FROM veiculos v
JOIN clientes c ON c.id = v.cliente_id
WHERE LOWER(c.nome) LIKE '%cristian%' 
   OR LOWER(v.marca) LIKE '%peugeot%'
   OR LOWER(v.modelo) LIKE '%308%'

UNION ALL

SELECT 
  'AGENDAMENTO' as tipo,
  a.id,
  a.titulo,
  v.placa,
  a.status
FROM agendamentos a
JOIN veiculos v ON v.id = a.veiculo_id
JOIN clientes c ON c.id = a.cliente_id
WHERE LOWER(c.nome) LIKE '%cristian%'
   OR LOWER(v.marca) LIKE '%peugeot%'
   OR LOWER(v.modelo) LIKE '%308%'

ORDER BY tipo;

-- 5. Teste de consulta como usuário anônimo (simular consulta pública)
-- Esta query simula o que a consulta pública deveria retornar
WITH veiculo_encontrado AS (
  SELECT v.*, c.nome as cliente_nome, c.telefone as cliente_telefone
  FROM veiculos v
  JOIN clientes c ON c.id = v.cliente_id
  WHERE LOWER(v.marca) LIKE '%peugeot%' 
    AND LOWER(v.modelo) LIKE '%308%'
  LIMIT 1
)
SELECT 
  'RESULTADO_CONSULTA' as tipo,
  ve.id as veiculo_id,
  ve.placa,
  ve.marca,
  ve.modelo,
  ve.cliente_nome,
  a.id as agendamento_id,
  a.titulo as agendamento_titulo,
  a.status as agendamento_status,
  a.data_inicio,
  a.data_fim,
  o.id as orcamento_id,
  o.numero_orcamento,
  o.status as orcamento_status
FROM veiculo_encontrado ve
LEFT JOIN agendamentos a ON a.veiculo_id = ve.id
LEFT JOIN orcamentos o ON o.veiculo_id = ve.id OR o.agendamento_id = a.id
ORDER BY a.data_inicio DESC, o.created_at DESC;