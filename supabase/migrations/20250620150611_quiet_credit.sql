/*
  # Sistema Garagem 601 - Schema Inicial

  1. Tabelas Principais
    - `clientes` - Dados dos clientes
    - `veiculos` - Veículos dos clientes
    - `estoque` - Controle de estoque
    - `orcamentos` - Orçamentos de serviços
    - `itens_orcamento` - Itens dos orçamentos
    - `laudos` - Laudos técnicos
    - `historico_manutencao` - Histórico de manutenções
    - `agendamentos` - Sistema de calendário
    - `configuracoes` - Configurações do sistema

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas para usuários autenticados

  3. Índices e Relacionamentos
    - Chaves estrangeiras apropriadas
    - Índices para otimização de consultas
*/

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text UNIQUE NOT NULL,
  telefone text NOT NULL,
  endereco text NOT NULL,
  cpf_cnpj text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de veículos
CREATE TABLE IF NOT EXISTS veiculos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES clientes(id) ON DELETE CASCADE,
  placa text UNIQUE NOT NULL,
  marca text NOT NULL,
  modelo text NOT NULL,
  ano integer NOT NULL,
  cor text NOT NULL,
  chassi text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de estoque
CREATE TABLE IF NOT EXISTS estoque (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  categoria text NOT NULL,
  preco decimal(10,2) NOT NULL DEFAULT 0,
  quantidade integer NOT NULL DEFAULT 0,
  quantidade_minima integer NOT NULL DEFAULT 0,
  fornecedor text NOT NULL,
  codigo_barras text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de orçamentos
CREATE TABLE IF NOT EXISTS orcamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES clientes(id) ON DELETE CASCADE,
  veiculo_id uuid REFERENCES veiculos(id) ON DELETE CASCADE,
  numero_orcamento text UNIQUE NOT NULL,
  descricao text NOT NULL,
  valor_total decimal(10,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado', 'em_andamento', 'concluido')),
  data_vencimento date NOT NULL,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de itens do orçamento
CREATE TABLE IF NOT EXISTS itens_orcamento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id uuid REFERENCES orcamentos(id) ON DELETE CASCADE,
  estoque_id uuid REFERENCES estoque(id) ON DELETE SET NULL,
  nome text NOT NULL,
  quantidade integer NOT NULL DEFAULT 1,
  preco decimal(10,2) NOT NULL DEFAULT 0,
  tipo text NOT NULL DEFAULT 'peca' CHECK (tipo IN ('peca', 'servico')),
  created_at timestamptz DEFAULT now()
);

-- Tabela de laudos
CREATE TABLE IF NOT EXISTS laudos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orcamento_id uuid REFERENCES orcamentos(id) ON DELETE CASCADE,
  numero_laudo text UNIQUE NOT NULL,
  tipo text NOT NULL DEFAULT 'tecnico' CHECK (tipo IN ('tecnico', 'vistoria', 'pericia')),
  descricao text NOT NULL,
  condicao_geral text NOT NULL DEFAULT 'bom' CHECK (condicao_geral IN ('otimo', 'bom', 'regular', 'ruim', 'pessimo')),
  itens_verificados text[] DEFAULT '{}',
  recomendacoes text[] DEFAULT '{}',
  fotos text[] DEFAULT '{}',
  responsavel_tecnico text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de histórico de manutenção
CREATE TABLE IF NOT EXISTS historico_manutencao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  veiculo_id uuid REFERENCES veiculos(id) ON DELETE CASCADE,
  orcamento_id uuid REFERENCES orcamentos(id) ON DELETE SET NULL,
  tipo text NOT NULL DEFAULT 'preventiva' CHECK (tipo IN ('preventiva', 'corretiva', 'revisao')),
  descricao text NOT NULL,
  itens_realizados text[] DEFAULT '{}',
  valor_total decimal(10,2) NOT NULL DEFAULT 0,
  data_realizacao date NOT NULL DEFAULT CURRENT_DATE,
  proxima_revisao date,
  km integer,
  responsavel text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS agendamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid REFERENCES clientes(id) ON DELETE CASCADE,
  veiculo_id uuid REFERENCES veiculos(id) ON DELETE CASCADE,
  orcamento_id uuid REFERENCES orcamentos(id) ON DELETE SET NULL,
  titulo text NOT NULL,
  descricao text,
  data_inicio timestamptz NOT NULL,
  data_fim timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'em_andamento', 'concluido', 'cancelado')),
  responsavel text,
  cor text DEFAULT '#3b82f6',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de configurações
CREATE TABLE IF NOT EXISTS configuracoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chave text UNIQUE NOT NULL,
  valor text NOT NULL,
  tipo text NOT NULL DEFAULT 'string' CHECK (tipo IN ('string', 'number', 'boolean', 'json')),
  descricao text,
  categoria text NOT NULL DEFAULT 'geral',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inserir configurações padrão
INSERT INTO configuracoes (chave, valor, tipo, descricao, categoria) VALUES
('horario_inicio', '08:00', 'string', 'Horário de início do funcionamento', 'calendario'),
('horario_fim', '18:00', 'string', 'Horário de fim do funcionamento', 'calendario'),
('intervalo_agendamento', '30', 'number', 'Intervalo entre agendamentos em minutos', 'calendario'),
('dias_funcionamento', '["1","2","3","4","5","6"]', 'json', 'Dias da semana de funcionamento (0=domingo, 6=sábado)', 'calendario'),
('nome_oficina', 'Garagem 601', 'string', 'Nome da oficina', 'geral'),
('telefone_oficina', '(11) 99999-0000', 'string', 'Telefone da oficina', 'geral'),
('endereco_oficina', 'Rua da Oficina, 601 - São Paulo/SP', 'string', 'Endereço da oficina', 'geral'),
('email_oficina', 'contato@garagem601.com', 'string', 'Email da oficina', 'geral')
ON CONFLICT (chave) DO NOTHING;

-- Habilitar RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE orcamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_orcamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE laudos ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_manutencao ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracoes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuários autenticados
CREATE POLICY "Usuários autenticados podem gerenciar clientes"
  ON clientes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem gerenciar veículos"
  ON veiculos FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem gerenciar estoque"
  ON estoque FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem gerenciar orçamentos"
  ON orcamentos FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem gerenciar itens de orçamento"
  ON itens_orcamento FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem gerenciar laudos"
  ON laudos FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem gerenciar histórico"
  ON historico_manutencao FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem gerenciar agendamentos"
  ON agendamentos FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem gerenciar configurações"
  ON configuracoes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Política especial para consulta pública (apenas leitura de orçamentos e veículos)
CREATE POLICY "Consulta pública pode ver orçamentos"
  ON orcamentos FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Consulta pública pode ver veículos"
  ON veiculos FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Consulta pública pode ver clientes"
  ON clientes FOR SELECT
  TO anon
  USING (true);

-- Índices para otimização
CREATE INDEX IF NOT EXISTS idx_veiculos_cliente_id ON veiculos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_placa ON veiculos(placa);
CREATE INDEX IF NOT EXISTS idx_orcamentos_cliente_id ON orcamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_veiculo_id ON orcamentos(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_orcamentos_status ON orcamentos(status);
CREATE INDEX IF NOT EXISTS idx_itens_orcamento_orcamento_id ON itens_orcamento(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_laudos_orcamento_id ON laudos(orcamento_id);
CREATE INDEX IF NOT EXISTS idx_historico_veiculo_id ON historico_manutencao(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data_inicio ON agendamentos(data_inicio);
CREATE INDEX IF NOT EXISTS idx_agendamentos_cliente_id ON agendamentos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_configuracoes_chave ON configuracoes(chave);
CREATE INDEX IF NOT EXISTS idx_configuracoes_categoria ON configuracoes(categoria);

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_veiculos_updated_at BEFORE UPDATE ON veiculos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_estoque_updated_at BEFORE UPDATE ON estoque FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orcamentos_updated_at BEFORE UPDATE ON orcamentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_laudos_updated_at BEFORE UPDATE ON laudos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agendamentos_updated_at BEFORE UPDATE ON agendamentos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_configuracoes_updated_at BEFORE UPDATE ON configuracoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();