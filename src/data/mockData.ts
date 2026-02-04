import { Cliente, Veiculo, ItemEstoque, Orcamento, Laudo, HistoricoManutencao } from '../types';

export const mockClientes: Cliente[] = [
  {
    id: '1',
    nome: 'João Silva Santos',
    email: 'joao.silva@email.com',
    telefone: '(11) 99999-1234',
    endereco: 'Rua das Flores, 123 - São Paulo/SP',
    cpfCnpj: '123.456.789-01',
    createdAt: new Date('2024-01-15')
  },
  {
    id: '2',
    nome: 'Maria Oliveira',
    email: 'maria.oliveira@email.com',
    telefone: '(11) 98888-5678',
    endereco: 'Av. Paulista, 456 - São Paulo/SP',
    cpfCnpj: '987.654.321-09',
    createdAt: new Date('2024-02-10')
  }
];

export const mockVeiculos: Veiculo[] = [
  {
    id: '1',
    clienteId: '1',
    placa: 'ABC-1234',
    marca: 'Honda',
    modelo: 'Civic',
    ano: 2020,
    cor: 'Prata',
    chassi: '1HGBH41JXMN109186'
  },
  {
    id: '2',
    clienteId: '2',
    placa: 'XYZ-5678',
    marca: 'Toyota',
    modelo: 'Corolla',
    ano: 2021,
    cor: 'Branco',
    chassi: '2T1BURHE5JC123456'
  }
];

export const mockEstoque: ItemEstoque[] = [
  {
    id: '1',
    nome: 'Óleo Motor 15W40',
    categoria: 'Lubrificantes',
    preco: 45.90,
    quantidade: 25,
    quantidadeMinima: 10,
    fornecedor: 'Distribuidora Auto Peças'
  },
  {
    id: '2',
    nome: 'Filtro de Óleo',
    categoria: 'Filtros',
    preco: 28.50,
    quantidade: 5,
    quantidadeMinima: 15,
    fornecedor: 'Mann Filter'
  },
  {
    id: '3',
    nome: 'Pastilha de Freio Dianteira',
    categoria: 'Freios',
    preco: 120.00,
    quantidade: 8,
    quantidadeMinima: 5,
    fornecedor: 'Freios Brasil'
  }
];

export const mockOrcamentos: Orcamento[] = [
  {
    id: '1',
    clienteId: '1',
    veiculoId: '1',
    numeroOrcamento: 'ORC-2024-001',
    descricao: 'Troca de óleo e filtros',
    itens: [
      { id: '1', estoqueId: '1', nome: 'Óleo Motor 15W40', quantidade: 4, preco: 45.90, tipo: 'peca' },
      { id: '2', estoqueId: '2', nome: 'Filtro de Óleo', quantidade: 1, preco: 28.50, tipo: 'peca' },
      { id: '3', nome: 'Mão de obra - Troca de óleo', quantidade: 1, preco: 80.00, tipo: 'servico' }
    ],
    valorTotal: 292.10,
    status: 'em_andamento',
    dataVencimento: new Date('2024-12-30'),
    createdAt: new Date('2024-12-15'),
    updatedAt: new Date('2024-12-15')
  }
];

export const mockLaudos: Laudo[] = [
  {
    id: '1',
    orcamentoId: '1',
    numeroLaudo: 'LAU-2024-001',
    tipo: 'tecnico',
    descricao: 'Vistoria completa do sistema de freios e suspensão',
    condicaoGeral: 'bom',
    itensVerificados: [
      'Sistema de freios',
      'Suspensão dianteira',
      'Suspensão traseira',
      'Pneus e rodas',
      'Sistema elétrico'
    ],
    recomendacoes: [
      'Troca das pastilhas de freio em 5.000km',
      'Verificar alinhamento e balanceamento'
    ],
    responsavelTecnico: 'Carlos Mecânico',
    createdAt: new Date('2024-12-15')
  }
];

export const mockHistorico: HistoricoManutencao[] = [
  {
    id: '1',
    veiculoId: '1',
    orcamentoId: '1',
    tipo: 'preventiva',
    descricao: 'Revisão dos 10.000km',
    itensRealizados: [
      'Troca de óleo do motor',
      'Troca do filtro de óleo',
      'Verificação de fluidos',
      'Inspeção visual do sistema de freios'
    ],
    valorTotal: 292.10,
    dataRealizacao: new Date('2024-12-15'),
    proximaRevisao: new Date('2025-06-15'),
    km: 10000,
    responsavel: 'Carlos Mecânico'
  }
];