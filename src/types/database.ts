export interface Database {
  public: {
    Tables: {
      clientes: {
        Row: {
          id: string;
          nome: string;
          email: string;
          telefone: string;
          endereco: string;
          cpf_cnpj: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          email: string;
          telefone: string;
          endereco: string;
          cpf_cnpj: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          email?: string;
          telefone?: string;
          endereco?: string;
          cpf_cnpj?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      veiculos: {
        Row: {
          id: string;
          cliente_id: string;
          placa: string;
          marca: string;
          modelo: string;
          ano: number;
          cor: string;
          chassi: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cliente_id: string;
          placa: string;
          marca: string;
          modelo: string;
          ano: number;
          cor: string;
          chassi: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cliente_id?: string;
          placa?: string;
          marca?: string;
          modelo?: string;
          ano?: number;
          cor?: string;
          chassi?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      estoque: {
        Row: {
          id: string;
          nome: string;
          categoria: string;
          preco: number;
          quantidade: number;
          quantidade_minima: number;
          fornecedor: string;
          codigo_barras: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          nome: string;
          categoria: string;
          preco?: number;
          quantidade?: number;
          quantidade_minima?: number;
          fornecedor: string;
          codigo_barras?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          nome?: string;
          categoria?: string;
          preco?: number;
          quantidade?: number;
          quantidade_minima?: number;
          fornecedor?: string;
          codigo_barras?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      orcamentos: {
        Row: {
          id: string;
          cliente_id: string;
          veiculo_id: string;
          numero_orcamento: string;
          descricao: string;
          valor_total: number;
          status: 'pendente' | 'aprovado' | 'rejeitado' | 'em_andamento' | 'concluido' | 'pago';
          data_vencimento: string;
          data_pagamento: string | null;
          observacoes: string | null;
          agendamento_id: string | null;
          desconto_geral: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cliente_id: string;
          veiculo_id: string;
          numero_orcamento: string;
          descricao: string;
          valor_total?: number;
          status?: 'pendente' | 'aprovado' | 'rejeitado' | 'em_andamento' | 'concluido' | 'pago';
          data_vencimento: string;
          data_pagamento?: string | null;
          observacoes?: string | null;
          agendamento_id?: string | null;
          desconto_geral?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cliente_id?: string;
          veiculo_id?: string;
          numero_orcamento?: string;
          descricao?: string;
          valor_total?: number;
          status?: 'pendente' | 'aprovado' | 'rejeitado' | 'em_andamento' | 'concluido' | 'pago';
          data_vencimento?: string;
          data_pagamento?: string | null;
          observacoes?: string | null;
          agendamento_id?: string | null;
          desconto_geral?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      itens_orcamento: {
        Row: {
          id: string;
          orcamento_id: string;
          estoque_id: string | null;
          nome: string;
          quantidade: number;
          preco: number;
          tipo: 'peca' | 'servico';
          created_at: string;
        };
        Insert: {
          id?: string;
          orcamento_id: string;
          estoque_id?: string | null;
          nome: string;
          quantidade?: number;
          preco?: number;
          tipo?: 'peca' | 'servico';
          created_at?: string;
        };
        Update: {
          id?: string;
          orcamento_id?: string;
          estoque_id?: string | null;
          nome?: string;
          quantidade?: number;
          preco?: number;
          tipo?: 'peca' | 'servico';
          created_at?: string;
        };
      };
      laudos: {
        Row: {
          id: string;
          orcamento_id: string;
          numero_laudo: string;
          tipo: 'tecnico' | 'vistoria' | 'pericia';
          descricao: string;
          condicao_geral: 'otimo' | 'bom' | 'regular' | 'ruim' | 'pessimo';
          itens_verificados: string[];
          recomendacoes: string[];
          fotos: string[];
          responsavel_tecnico: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          orcamento_id: string;
          numero_laudo: string;
          tipo?: 'tecnico' | 'vistoria' | 'pericia';
          descricao: string;
          condicao_geral?: 'otimo' | 'bom' | 'regular' | 'ruim' | 'pessimo';
          itens_verificados?: string[];
          recomendacoes?: string[];
          fotos?: string[];
          responsavel_tecnico: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          orcamento_id?: string;
          numero_laudo?: string;
          tipo?: 'tecnico' | 'vistoria' | 'pericia';
          descricao?: string;
          condicao_geral?: 'otimo' | 'bom' | 'regular' | 'ruim' | 'pessimo';
          itens_verificados?: string[];
          recomendacoes?: string[];
          fotos?: string[];
          responsavel_tecnico?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      historico_manutencao: {
        Row: {
          id: string;
          veiculo_id: string;
          orcamento_id: string | null;
          tipo: 'preventiva' | 'corretiva' | 'revisao';
          descricao: string;
          itens_realizados: string[];
          valor_total: number;
          data_realizacao: string;
          proxima_revisao: string | null;
          km: number | null;
          responsavel: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          veiculo_id: string;
          orcamento_id?: string | null;
          tipo?: 'preventiva' | 'corretiva' | 'revisao';
          descricao: string;
          itens_realizados?: string[];
          valor_total?: number;
          data_realizacao?: string;
          proxima_revisao?: string | null;
          km?: number | null;
          responsavel: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          veiculo_id?: string;
          orcamento_id?: string | null;
          tipo?: 'preventiva' | 'corretiva' | 'revisao';
          descricao?: string;
          itens_realizados?: string[];
          valor_total?: number;
          data_realizacao?: string;
          proxima_revisao?: string | null;
          km?: number | null;
          responsavel?: string;
          created_at?: string;
        };
      };
      agendamentos: {
        Row: {
          id: string;
          cliente_id: string;
          veiculo_id: string;
          orcamento_id: string | null;
          titulo: string;
          descricao: string | null;
          data_inicio: string;
          data_fim: string;
          status: 'aguardando_inicio' | 'em_analise' | 'aguardando_aprovacao' | 'em_preparacao' | 'aguardando_pecas' | 'no_elevador' | 'em_manutencao' | 'concluido' | 'aguardando_retirada' | 'agendado' | 'em_andamento' | 'cancelado';
          responsavel: string | null;
          cor: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cliente_id: string;
          veiculo_id: string;
          orcamento_id?: string | null;
          titulo: string;
          descricao?: string | null;
          data_inicio: string;
          data_fim: string;
          status?: 'aguardando_inicio' | 'em_analise' | 'aguardando_aprovacao' | 'em_preparacao' | 'aguardando_pecas' | 'no_elevador' | 'em_manutencao' | 'concluido' | 'aguardando_retirada' | 'agendado' | 'em_andamento' | 'cancelado';
          responsavel?: string | null;
          cor?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cliente_id?: string;
          veiculo_id?: string;
          orcamento_id?: string | null;
          titulo?: string;
          descricao?: string | null;
          data_inicio?: string;
          data_fim?: string;
          status?: 'aguardando_inicio' | 'em_analise' | 'aguardando_aprovacao' | 'em_preparacao' | 'aguardando_pecas' | 'no_elevador' | 'em_manutencao' | 'concluido' | 'aguardando_retirada' | 'agendado' | 'em_andamento' | 'cancelado';
          responsavel?: string | null;
          cor?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      configuracoes: {
        Row: {
          id: string;
          chave: string;
          valor: string;
          tipo: 'string' | 'number' | 'boolean' | 'json';
          descricao: string | null;
          categoria: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          chave: string;
          valor: string;
          tipo?: 'string' | 'number' | 'boolean' | 'json';
          descricao?: string | null;
          categoria?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          chave?: string;
          valor?: string;
          tipo?: 'string' | 'number' | 'boolean' | 'json';
          descricao?: string | null;
          categoria?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}