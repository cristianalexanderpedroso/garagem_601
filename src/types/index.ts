export interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  cpfCnpj: string;
  createdAt: Date;
}

export interface Veiculo {
  id: string;
  clienteId: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  cor: string;
  chassi: string;
}

export interface ItemEstoque {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  quantidade: number;
  quantidadeMinima: number;
  fornecedor: string;
  codigoBarras?: string;
}

export interface ItemOrcamento {
  id: string;
  estoqueId?: string;
  nome: string;
  quantidade: number;
  preco: number;
  tipo: 'peca' | 'servico';
}

export interface Orcamento {
  id: string;
  clienteId: string;
  veiculoId: string;
  numeroOrcamento: string;
  descricao: string;
  itens: ItemOrcamento[];
  valorTotal: number;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'em_andamento' | 'concluido';
  dataVencimento: Date;
  createdAt: Date;
  updatedAt: Date;
  observacoes?: string;
}

export interface Laudo {
  id: string;
  orcamentoId: string;
  numeroLaudo: string;
  tipo: 'tecnico' | 'vistoria' | 'pericia';
  descricao: string;
  condicaoGeral: 'otimo' | 'bom' | 'regular' | 'ruim' | 'pessimo';
  itensVerificados: string[];
  recomendacoes: string[];
  fotos?: string[];
  responsavelTecnico: string;
  createdAt: Date;
}

export interface HistoricoManutencao {
  id: string;
  veiculoId: string;
  orcamentoId: string;
  tipo: 'preventiva' | 'corretiva' | 'revisao';
  descricao: string;
  itensRealizados: string[];
  valorTotal: number;
  dataRealizacao: Date;
  proximaRevisao?: Date;
  km?: number;
  responsavel: string;
}

export interface Agendamento {
  id: string;
  clienteId: string;
  veiculoId: string;
  orcamentoId?: string;
  titulo: string;
  descricao?: string;
  dataInicio: Date;
  dataFim: Date;
  status: 'aguardando_inicio' | 'em_analise' | 'aguardando_aprovacao' | 'em_preparacao' | 'aguardando_pecas' | 'no_elevador' | 'em_manutencao' | 'concluido' | 'aguardando_retirada' | 'agendado' | 'em_andamento' | 'cancelado';
  responsavel?: string;
  cor: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Configuracao {
  id: string;
  chave: string;
  valor: string;
  tipo: 'string' | 'number' | 'boolean' | 'json';
  descricao?: string;
  categoria: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConsultaPublica {
  placa: string;
  status: string;
  descricao: string;
  dataEntrada: Date;
  previsaoEntrega?: Date;
  etapas: {
    nome: string;
    concluida: boolean;
    dataConclusa?: Date;
  }[];
}

export type ViewMode = 'month' | 'week' | 'day';

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  color: string;
  cliente?: string;
  veiculo?: string;
  status: string;
}