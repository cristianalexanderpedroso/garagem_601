import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileText, 
  Package, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Car,
  Calendar,
  Wrench,
  ChevronLeft,
  ChevronRight,
  CreditCard
} from 'lucide-react';
import Card from '../components/Card';
import { supabase } from '../lib/supabase';

interface DashboardStats {
  totalClientes: number;
  totalVeiculos: number;
  orcamentosAtivos: number;
  orcamentosPendentes: number;
  orcamentosPagos: number;
  orcamentosAguardandoPagamento: number;
  itensEstoqueBaixo: number;
  faturamentoMes: number;
  agendamentosHoje: number;
  servicosRealizados: number;
}

interface OrcamentoRecente {
  id: string;
  numero_orcamento: string;
  descricao: string;
  valor_total: number;
  status: string;
  data_pagamento?: string;
  created_at: string;
  clientes: {
    nome: string;
  };
}

interface ItemEstoqueBaixo {
  id: string;
  nome: string;
  categoria: string;
  quantidade: number;
  quantidade_minima: number;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalClientes: 0,
    totalVeiculos: 0,
    orcamentosAtivos: 0,
    orcamentosPendentes: 0,
    orcamentosPagos: 0,
    orcamentosAguardandoPagamento: 0,
    itensEstoqueBaixo: 0,
    faturamentoMes: 0,
    agendamentosHoje: 0,
    servicosRealizados: 0
  });
  const [orcamentosRecentes, setOrcamentosRecentes] = useState<OrcamentoRecente[]>([]);
  const [itensEstoqueBaixo, setItensEstoqueBaixo] = useState<ItemEstoqueBaixo[]>([]);
  const [loading, setLoading] = useState(true);
  const [mesAtual, setMesAtual] = useState(new Date());

  const fetchDashboardData = async (dataReferencia: Date = new Date()) => {
    try {
      setLoading(true);

      // Calcular início e fim do mês
      const inicioMes = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth(), 1);
      const fimMes = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth() + 1, 0);

      // Buscar estatísticas em paralelo
      const [
        clientesResult,
        veiculosResult,
        orcamentosResult,
        estoqueResult,
        agendamentosResult,
        historicoResult
      ] = await Promise.all([
        // Total de clientes
        supabase.from('clientes').select('id', { count: 'exact', head: true }),
        
        // Total de veículos
        supabase.from('veiculos').select('id', { count: 'exact', head: true }),
        
        // Orçamentos
        supabase.from('orcamentos').select('*'),
        
        // Estoque (apenas produtos)
        supabase.from('estoque').select('*').eq('tipo', 'produto'),
        
        // Agendamentos de hoje
        supabase
          .from('agendamentos')
          .select('*')
          .gte('data_inicio', new Date().toISOString().split('T')[0])
          .lt('data_inicio', new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
        
        // Histórico do mês atual
        supabase
          .from('historico_manutencao')
          .select('*')
          .gte('data_realizacao', inicioMes.toISOString().split('T')[0])
          .lte('data_realizacao', fimMes.toISOString().split('T')[0])
      ]);

      // Buscar orçamentos recentes com informações do cliente
      const { data: orcamentosRecentesData } = await supabase
        .from('orcamentos')
        .select(`
          id,
          numero_orcamento,
          descricao,
          valor_total,
          status,
          data_pagamento,
          created_at,
          clientes (nome)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      // Calcular estatísticas
      const orcamentos = orcamentosResult.data || [];
      const estoque = estoqueResult.data || [];
      const agendamentos = agendamentosResult.data || [];
      const historico = historicoResult.data || [];

      // Faturamento do mês (baseado na data de pagamento)
      const faturamentoMes = orcamentos
        .filter(o => {
          if (o.status === 'pago' && o.data_pagamento) {
            const dataPagamento = new Date(o.data_pagamento + 'T00:00:00');
            return dataPagamento >= inicioMes && dataPagamento <= fimMes;
          }
          return false;
        })
        .reduce((acc, o) => acc + o.valor_total, 0);

      // Contar orçamentos pagos no mês
      const orcamentosPagos = orcamentos.filter(o => {
        if (o.status === 'pago' && o.data_pagamento) {
          const dataPagamento = new Date(o.data_pagamento + 'T00:00:00');
          return dataPagamento >= inicioMes && dataPagamento <= fimMes;
        }
        return false;
      }).length;

      // Contar orçamentos aguardando pagamento (aprovados ou concluídos mas não pagos)
      const orcamentosAguardandoPagamento = orcamentos.filter(o => 
        (o.status === 'aprovado' || o.status === 'concluido') && o.status !== 'pago'
      ).length;

      // Itens com estoque baixo
      const itensEstoqueBaixoData = estoque.filter(item => 
        item.quantidade <= item.quantidade_minima
      );

      setStats({
        totalClientes: clientesResult.count || 0,
        totalVeiculos: veiculosResult.count || 0,
        orcamentosAtivos: orcamentos.filter(o => o.status === 'em_andamento').length,
        orcamentosPendentes: orcamentos.filter(o => o.status === 'pendente').length,
        orcamentosPagos,
        orcamentosAguardandoPagamento,
        itensEstoqueBaixo: itensEstoqueBaixoData.length,
        faturamentoMes,
        agendamentosHoje: agendamentos.length,
        servicosRealizados: historico.length
      });

      setOrcamentosRecentes(orcamentosRecentesData || []);
      setItensEstoqueBaixo(itensEstoqueBaixoData.slice(0, 5));

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(mesAtual);
  }, [mesAtual]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'em_andamento':
        return <Clock className="h-3 w-3 text-blue-500 mr-1" />;
      case 'concluido':
        return <CheckCircle className="h-3 w-3 text-green-500 mr-1" />;
      case 'aprovado':
        return <CheckCircle className="h-3 w-3 text-green-500 mr-1" />;
      case 'pendente':
        return <Clock className="h-3 w-3 text-yellow-500 mr-1" />;
      case 'pago':
        return <CreditCard className="h-3 w-3 text-green-600 mr-1" />;
      default:
        return <Clock className="h-3 w-3 text-gray-500 mr-1" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'em_andamento':
        return 'Em andamento';
      case 'concluido':
        return 'Concluído';
      case 'aprovado':
        return 'Aprovado';
      case 'pendente':
        return 'Pendente';
      case 'rejeitado':
        return 'Rejeitado';
      case 'pago':
        return 'Pago';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'em_andamento':
        return 'text-blue-500';
      case 'concluido':
      case 'aprovado':
        return 'text-green-500';
      case 'pendente':
        return 'text-yellow-500';
      case 'rejeitado':
        return 'text-red-500';
      case 'pago':
        return 'text-green-600';
      default:
        return 'text-gray-500';
    }
  };

  const navegarMes = (direcao: 'anterior' | 'proximo') => {
    const novoMes = new Date(mesAtual);
    if (direcao === 'anterior') {
      novoMes.setMonth(novoMes.getMonth() - 1);
    } else {
      novoMes.setMonth(novoMes.getMonth() + 1);
    }
    setMesAtual(novoMes);
  };

  const voltarMesAtual = () => {
    setMesAtual(new Date());
  };

  const formatarMesAno = (data: Date) => {
    return data.toLocaleDateString('pt-BR', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const ehMesAtual = () => {
    const agora = new Date();
    return mesAtual.getMonth() === agora.getMonth() && 
           mesAtual.getFullYear() === agora.getFullYear();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        </div>
        <Card>
          <div className="p-12 text-center">
            <div className="text-gray-400">Carregando dados...</div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        
        {/* Controles de navegação por mês */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-[#2e2e2e] rounded-lg p-1">
            <button
              onClick={() => navegarMes('anterior')}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <div className="px-4 py-2 text-white font-medium min-w-[180px] text-center">
              {formatarMesAno(mesAtual)}
            </div>
            
            <button
              onClick={() => navegarMes('proximo')}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          
          {!ehMesAtual() && (
            <button
              onClick={voltarMesAtual}
              className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Mês Atual
            </button>
          )}
          
          <div className="text-sm text-gray-400">
            Última atualização: {new Date().toLocaleTimeString('pt-BR')}
          </div>
        </div>
      </div>

      {/* Cards de estatísticas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card hover>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total de Clientes</p>
                <p className="text-2xl font-bold text-white">{stats.totalClientes}</p>
              </div>
              <div className="p-3 bg-red-500 bg-opacity-20 rounded-full">
                <Users className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">Ativo</span>
              <span className="text-gray-400 ml-2">cadastrados</span>
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Veículos</p>
                <p className="text-2xl font-bold text-white">{stats.totalVeiculos}</p>
              </div>
              <div className="p-3 bg-blue-500 bg-opacity-20 rounded-full">
                <Car className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Car className="h-4 w-4 text-blue-500 mr-1" />
              <span className="text-gray-400">cadastrados</span>
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Pagos no Mês</p>
                <p className="text-2xl font-bold text-white">{stats.orcamentosPagos}</p>
              </div>
              <div className="p-3 bg-green-500 bg-opacity-20 rounded-full">
                <CreditCard className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-gray-400">orçamentos</span>
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Faturamento Mês</p>
                <p className="text-2xl font-bold text-white">
                  R$ {stats.faturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-green-500 bg-opacity-20 rounded-full">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-500">Pagamentos</span>
              <span className="text-gray-400 ml-2">recebidos</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Cards de estatísticas secundárias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card hover>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Aguardando Pagamento</p>
                <p className="text-2xl font-bold text-white">{stats.orcamentosAguardandoPagamento}</p>
              </div>
              <div className="p-3 bg-yellow-500 bg-opacity-20 rounded-full">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <FileText className="h-4 w-4 text-yellow-500 mr-1" />
              <span className="text-gray-400">orçamentos</span>
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Pendentes</p>
                <p className="text-2xl font-bold text-white">{stats.orcamentosPendentes}</p>
              </div>
              <div className="p-3 bg-orange-500 bg-opacity-20 rounded-full">
                <Clock className="h-6 w-6 text-orange-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <FileText className="h-4 w-4 text-orange-500 mr-1" />
              <span className="text-gray-400">orçamentos</span>
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Estoque Baixo</p>
                <p className="text-2xl font-bold text-white">{stats.itensEstoqueBaixo}</p>
              </div>
              <div className="p-3 bg-red-500 bg-opacity-20 rounded-full">
                <AlertTriangle className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <Package className="h-4 w-4 text-red-500 mr-1" />
              <span className="text-red-500">Requer atenção</span>
            </div>
          </div>
        </Card>

        <Card hover>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Serviços Este Mês</p>
                <p className="text-2xl font-bold text-white">{stats.servicosRealizados}</p>
              </div>
              <div className="p-3 bg-cyan-500 bg-opacity-20 rounded-full">
                <Wrench className="h-6 w-6 text-cyan-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <CheckCircle className="h-4 w-4 text-cyan-500 mr-1" />
              <span className="text-gray-400">realizados</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orçamentos recentes */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Orçamentos Recentes</h2>
              <button className="text-red-400 hover:text-red-300 text-sm">Ver todos</button>
            </div>
            <div className="space-y-4">
              {orcamentosRecentes.length > 0 ? (
                orcamentosRecentes.map((orcamento) => (
                  <div key={orcamento.id} className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg">
                    <div>
                      <p className="font-medium text-white">{orcamento.numero_orcamento}</p>
                      <p className="text-sm text-gray-400">{orcamento.clientes.nome}</p>
                      <p className="text-xs text-gray-500">{orcamento.descricao}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-white">
                        R$ {orcamento.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <div className={`flex items-center text-sm ${getStatusColor(orcamento.status)}`}>
                        {getStatusIcon(orcamento.status)}
                        <span>{getStatusLabel(orcamento.status)}</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {orcamento.status === 'pago' && orcamento.data_pagamento 
                          ? `Pago em ${new Date(orcamento.data_pagamento + 'T00:00:00').toLocaleDateString('pt-BR')}`
                          : new Date(orcamento.created_at).toLocaleDateString('pt-BR')
                        }
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum orçamento encontrado</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Itens com estoque baixo */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Estoque Baixo</h2>
              <button className="text-red-400 hover:text-red-300 text-sm">Ver estoque</button>
            </div>
            <div className="space-y-4">
              {itensEstoqueBaixo.length > 0 ? (
                itensEstoqueBaixo.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg">
                    <div>
                      <p className="font-medium text-white">{item.nome}</p>
                      <p className="text-sm text-gray-400">{item.categoria}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center">
                        <AlertTriangle className="h-4 w-4 text-red-500 mr-2" />
                        <span className="text-red-500 font-medium">{item.quantidade} unidades</span>
                      </div>
                      <p className="text-sm text-gray-400">Min: {item.quantidade_minima}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-400">Todos os itens estão com estoque adequado</p>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Resumo rápido */}
      <Card>
        <div className="p-6">
          <h2 className="text-xl font-semibold text-white mb-4">
            Resumo de {formatarMesAno(mesAtual)}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-[#1a1a1a] rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats.orcamentosPagos}</p>
              <p className="text-sm text-gray-400">Orçamentos Pagos</p>
            </div>
            <div className="p-4 bg-[#1a1a1a] rounded-lg">
              <p className="text-2xl font-bold text-yellow-500">{stats.orcamentosAguardandoPagamento}</p>
              <p className="text-sm text-gray-400">Aguardando Pagamento</p>
            </div>
            <div className="p-4 bg-[#1a1a1a] rounded-lg">
              <p className="text-2xl font-bold text-white">{stats.servicosRealizados}</p>
              <p className="text-sm text-gray-400">Serviços Realizados</p>
            </div>
            <div className="p-4 bg-[#1a1a1a] rounded-lg">
              <p className="text-2xl font-bold text-green-500">
                R$ {stats.faturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-gray-400">Faturamento</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;