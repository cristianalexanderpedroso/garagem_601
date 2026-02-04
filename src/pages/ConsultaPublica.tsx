import React, { useState } from 'react';
import { Search, Car, Clock, CheckCircle, AlertCircle, Calendar, User, Phone, MapPin, FileText, Package, Wrench, ArrowLeft } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';

interface ConsultaResult {
  veiculo: {
    id: string;
    placa: string;
    marca: string;
    modelo: string;
    ano: number;
    cor: string;
    imagem_url?: string;
  };
  cliente: {
    nome: string;
    telefone: string;
  };
  agendamento?: {
    id: string;
    titulo: string;
    descricao?: string;
    status: string;
    data_inicio: string;
    data_fim: string;
    responsavel?: string;
    updated_at?: string;
  };
  orcamento?: {
    id: string;
    numero_orcamento: string;
    descricao: string;
    valor_total: number;
    status: string;
    data_vencimento: string;
    data_pagamento?: string;
    observacoes?: string;
    itens?: Array<{
      nome: string;
      quantidade: number;
      preco: number;
      tipo: string;
    }>;
  };
}

interface Configuracoes {
  telefone_oficina?: string;
  endereco_oficina?: string;
  horario_funcionamento_texto?: string;
  nome_oficina?: string;
  email_oficina?: string;
  funcionamento_sabado?: string;
  horario_inicio?: string;
  horario_fim?: string;
  horario_sabado_inicio?: string;
  horario_sabado_fim?: string;
}

// Valores padrão conforme especificado
const VALORES_PADRAO = {
  telefone_oficina: '(41) 98777-0225',
  endereco_oficina: 'Rua Princesa Izabel, 601, Ipe - São José dos Pinhais, PR',
  horario_funcionamento_texto: 'Segunda a Sexta das 8h às 18h',
  nome_oficina: 'Garagem 601',
  email_oficina: 'contato@garagem601.com'
};

const STATUS_LABELS = {
  'aguardando_inicio': 'Aguardando Início',
  'em_analise': 'Em Análise',
  'aguardando_aprovacao': 'Aguardando Aprovação do Orçamento',
  'em_preparacao': 'Em Preparação',
  'aguardando_pecas': 'Aguardando Peças',
  'no_elevador': 'No Elevador',
  'em_manutencao': 'Em Manutenção',
  'concluido': 'Concluído',
  'aguardando_retirada': 'Aguardando Retirada do Veículo',
  'cancelado': 'Cancelado'
};

const STATUS_COLORS = {
  'aguardando_inicio': 'text-gray-400 bg-gray-500 bg-opacity-20',
  'em_analise': 'text-blue-400 bg-blue-500 bg-opacity-20',
  'aguardando_aprovacao': 'text-yellow-400 bg-yellow-500 bg-opacity-20',
  'em_preparacao': 'text-purple-400 bg-purple-500 bg-opacity-20',
  'aguardando_pecas': 'text-orange-400 bg-orange-500 bg-opacity-20',
  'no_elevador': 'text-cyan-400 bg-cyan-500 bg-opacity-20',
  'em_manutencao': 'text-red-400 bg-red-500 bg-opacity-20',
  'concluido': 'text-green-400 bg-green-500 bg-opacity-20',
  'aguardando_retirada': 'text-green-400 bg-green-500 bg-opacity-20',
  'cancelado': 'text-gray-400 bg-gray-500 bg-opacity-20'
};

const STATUS_ICONS = {
  'aguardando_inicio': Clock,
  'em_analise': Search,
  'aguardando_aprovacao': AlertCircle,
  'em_preparacao': Clock,
  'aguardando_pecas': AlertCircle,
  'no_elevador': Car,
  'em_manutencao': Car,
  'concluido': CheckCircle,
  'aguardando_retirada': CheckCircle,
  'cancelado': AlertCircle
};

const ORCAMENTO_STATUS_LABELS = {
  'pendente': 'Pendente',
  'aprovado': 'Aprovado',
  'rejeitado': 'Rejeitado',
  'em_andamento': 'Em Andamento',
  'concluido': 'Concluído',
  'pago': 'Pago'
};

const ConsultaPublica: React.FC = () => {
  const [placa, setPlaca] = useState('');
  const [consulta, setConsulta] = useState<ConsultaResult | null>(null);
  const [configuracoes, setConfiguracoes] = useState<Configuracoes>(VALORES_PADRAO);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Carregar configurações da oficina
  const carregarConfiguracoes = async () => {
    try {
      const { data, error } = await supabase
        .from('configuracoes')
        .select('chave, valor')
        .in('chave', [
          'telefone_oficina',
          'endereco_oficina', 
          'horario_funcionamento_texto',
          'nome_oficina',
          'email_oficina',
          'funcionamento_sabado',
          'horario_inicio',
          'horario_fim',
          'horario_sabado_inicio',
          'horario_sabado_fim'
        ]);

      if (error) throw error;

      const configMap = data.reduce((acc, config) => {
        acc[config.chave] = config.valor;
        return acc;
      }, {} as Record<string, string>);

      // Mesclar com valores padrão (valores padrão têm prioridade se config estiver vazia)
      const configFinal = {
        ...VALORES_PADRAO,
        ...Object.fromEntries(
          Object.entries(configMap).filter(([_, value]) => value && value.trim() !== '')
        )
      };

      setConfiguracoes(configFinal);
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
      // Usar valores padrão se não conseguir carregar
      setConfiguracoes(VALORES_PADRAO);
    }
  };

  React.useEffect(() => {
    carregarConfiguracoes();
  }, []);

  const handleConsulta = async () => {
    if (!placa.trim()) return;

    setLoading(true);
    setNotFound(false);
    setConsulta(null);

    try {
      // Normalizar a placa para busca (remover hífen e converter para maiúscula)
      const placaNormalizada = placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      const placaComHifen = placa.toUpperCase();

      console.log('🔍 Iniciando consulta para placa:', { original: placa, normalizada: placaNormalizada, comHifen: placaComHifen });

      // Buscar veículo por placa (tentar várias variações)
      const { data: veiculoData, error: veiculoError } = await supabase
        .from('veiculos')
        .select(`
          *,
          clientes(nome, telefone)
        `)
        .or(`placa.eq.${placaNormalizada},placa.eq.${placaComHifen}`);

      if (veiculoError) {
        console.error('❌ Erro na busca do veículo:', veiculoError);
        throw veiculoError;
      }

      console.log('🚗 Veículos encontrados:', veiculoData);

      if (!veiculoData || veiculoData.length === 0) {
        console.log('❌ Nenhum veículo encontrado');
        setNotFound(true);
        setLoading(false);
        return;
      }

      const veiculo = veiculoData[0];
      console.log('✅ Veículo selecionado:', veiculo);

      // BUSCAR AGENDAMENTOS - Buscar TODOS os agendamentos do veículo
      // Ordenar por data_inicio descendente para pegar o mais recente
      const { data: agendamentosData, error: agendamentoError } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('veiculo_id', veiculo.id)
        .order('data_inicio', { ascending: false });

      if (agendamentoError) {
        console.error('❌ Erro na busca dos agendamentos:', agendamentoError);
      } else {
        console.log('📅 TODOS os agendamentos encontrados:', agendamentosData);
      }

      let agendamentoAtual = null;
      let orcamento = null;

      // Priorizar agendamentos não cancelados, mas se não houver, mostrar o mais recente
      if (agendamentosData && agendamentosData.length > 0) {
        // Primeiro, tentar encontrar um agendamento não cancelado
        const agendamentosAtivos = agendamentosData.filter(a => a.status !== 'cancelado');
        
        if (agendamentosAtivos.length > 0) {
          agendamentoAtual = agendamentosAtivos[0]; // Mais recente não cancelado
          console.log('✅ Agendamento ativo encontrado:', agendamentoAtual);
        } else {
          // Se todos estão cancelados, pegar o mais recente mesmo assim
          agendamentoAtual = agendamentosData[0];
          console.log('⚠️ Apenas agendamentos cancelados encontrados, usando o mais recente:', agendamentoAtual);
        }
      }

      // 3. Se ainda não temos agendamento, buscar por orçamentos que referenciam este veículo
      if (!agendamentoAtual) {
        console.log('🔍 Buscando agendamentos via orçamentos do veículo');
        
        const { data: orcamentosVeiculo } = await supabase
          .from('orcamentos')
          .select('agendamento_id')
          .eq('veiculo_id', veiculo.id)
          .not('agendamento_id', 'is', null);

        if (orcamentosVeiculo && orcamentosVeiculo.length > 0) {
          const agendamentoIds = orcamentosVeiculo.map(o => o.agendamento_id).filter(Boolean);
          
          if (agendamentoIds.length > 0) {
            const { data: agendamentosViaOrcamento } = await supabase
              .from('agendamentos')
              .select('*')
              .in('id', agendamentoIds)
              .order('data_inicio', { ascending: false });

            if (agendamentosViaOrcamento && agendamentosViaOrcamento.length > 0) {
              const agendamentosAtivosViaOrcamento = agendamentosViaOrcamento.filter(a => a.status !== 'cancelado');
              agendamentoAtual = agendamentosAtivosViaOrcamento.length > 0 
                ? agendamentosAtivosViaOrcamento[0] 
                : agendamentosViaOrcamento[0];
              
              console.log('✅ Agendamento encontrado via orçamentos:', agendamentoAtual);
            }
          }
        }
      }

      // BUSCAR ORÇAMENTO
      // 1. Se há agendamento com orçamento vinculado, usar esse orçamento
      if (agendamentoAtual && agendamentoAtual.orcamento_id) {
        console.log('🔍 Buscando orçamento vinculado ao agendamento:', agendamentoAtual.orcamento_id);
        
        const { data: orcamentoData, error: orcamentoError } = await supabase
          .from('orcamentos')
          .select('*')
          .eq('id', agendamentoAtual.orcamento_id)
          .single();

        if (!orcamentoError && orcamentoData) {
          console.log('💰 Orçamento vinculado ao agendamento encontrado:', orcamentoData);
          
          // Buscar itens do orçamento
          const { data: itensData } = await supabase
            .from('itens_orcamento')
            .select('nome, quantidade, preco, tipo')
            .eq('orcamento_id', orcamentoData.id);

          orcamento = {
            ...orcamentoData,
            itens: itensData || []
          };
        }
      }

      // 2. Se não há orçamento vinculado ao agendamento, buscar orçamento mais recente do veículo
      if (!orcamento) {
        console.log('🔍 Buscando orçamento mais recente do veículo');
        
        const { data: orcamentoData, error: orcamentoError } = await supabase
          .from('orcamentos')
          .select('*')
          .eq('veiculo_id', veiculo.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!orcamentoError && orcamentoData) {
          console.log('💰 Orçamento mais recente encontrado:', orcamentoData);
          
          // Buscar itens do orçamento
          const { data: itensData } = await supabase
            .from('itens_orcamento')
            .select('nome, quantidade, preco, tipo')
            .eq('orcamento_id', orcamentoData.id);

          orcamento = {
            ...orcamentoData,
            itens: itensData || []
          };

          // Se este orçamento tem agendamento_id e não temos agendamento ainda, buscar
          if (!agendamentoAtual && orcamentoData.agendamento_id) {
            const { data: agendamentoPorOrcamento } = await supabase
              .from('agendamentos')
              .select('*')
              .eq('id', orcamentoData.agendamento_id)
              .single();
            
            if (agendamentoPorOrcamento) {
              agendamentoAtual = agendamentoPorOrcamento;
              console.log('✅ Agendamento encontrado via orçamento:', agendamentoAtual);
            }
          }
        }
      }

      const result: ConsultaResult = {
        veiculo: veiculo,
        cliente: veiculo.clientes,
        agendamento: agendamentoAtual,
        orcamento: orcamento
      };

      console.log('🎯 Resultado final da consulta:', result);
      setConsulta(result);
    } catch (error) {
      console.error('❌ Erro na consulta:', error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  const formatPlaca = (value: string) => {
    // Remove caracteres não alfanuméricos
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    // Aplica formato AAA-0000 ou AAA0A00 (Mercosul)
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 7) {
      return cleaned.slice(0, 3) + '-' + cleaned.slice(3);
    }
    
    return cleaned.slice(0, 3) + '-' + cleaned.slice(3, 7);
  };

  const handlePlacaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPlaca(e.target.value);
    setPlaca(formatted);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConsulta();
    }
  };

  const getStatusInfo = (status: string) => {
    const label = STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status;
    const color = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.aguardando_inicio;
    const Icon = STATUS_ICONS[status as keyof typeof STATUS_ICONS] || Clock;
    
    return { label, color, Icon };
  };

  const getOrcamentoStatusLabel = (status: string) => {
    return ORCAMENTO_STATUS_LABELS[status as keyof typeof ORCAMENTO_STATUS_LABELS] || status;
  };

  const getOrcamentoStatusColor = (status: string) => {
    switch (status) {
      case 'pago':
        return 'bg-green-500 bg-opacity-20 text-green-400';
      case 'aprovado':
      case 'concluido':
        return 'bg-blue-500 bg-opacity-20 text-blue-400';
      case 'em_andamento':
        return 'bg-yellow-500 bg-opacity-20 text-yellow-400';
      case 'pendente':
        return 'bg-orange-500 bg-opacity-20 text-orange-400';
      case 'rejeitado':
        return 'bg-red-500 bg-opacity-20 text-red-400';
      default:
        return 'bg-gray-500 bg-opacity-20 text-gray-400';
    }
  };

  const getPrevisaoEntrega = (status: string, dataFim: string) => {
    if (status === 'concluido' || status === 'aguardando_retirada') {
      return 'Pronto para retirada';
    }
    
    if (dataFim) {
      const dataFimDate = new Date(dataFim);
      return `Previsão: ${dataFimDate.toLocaleDateString('pt-BR')} às ${dataFimDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return 'Previsão a definir';
  };

  const getDataFinalizacao = (status: string, updatedAt?: string) => {
    if ((status === 'concluido' || status === 'aguardando_retirada') && updatedAt) {
      const dataFinalizacao = new Date(updatedAt);
      return `Finalizado em: ${dataFinalizacao.toLocaleDateString('pt-BR')} às ${dataFinalizacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return null;
  };

  const voltarParaInicio = () => {
    setConsulta(null);
    setNotFound(false);
    setPlaca('');
  };

  // Função para gerar horário de funcionamento baseado nas configurações
  const getHorarioFuncionamento = () => {
    // Se existe texto personalizado, usar ele
    if (configuracoes.horario_funcionamento_texto) {
      return configuracoes.horario_funcionamento_texto;
    }

    // Senão, gerar automaticamente
    const inicio = configuracoes.horario_inicio || '08:00';
    const fim = configuracoes.horario_fim || '18:00';
    const funcionaSabado = configuracoes.funcionamento_sabado === 'true';
    const inicioSabado = configuracoes.horario_sabado_inicio || '08:00';
    const fimSabado = configuracoes.horario_sabado_fim || '12:00';

    let texto = `Segunda a Sexta das ${inicio.replace(':', 'h')} às ${fim.replace(':', 'h')}`;
    
    if (funcionaSabado) {
      texto += `, Sábado das ${inicioSabado.replace(':', 'h')} às ${fimSabado.replace(':', 'h')}`;
    }

    return texto;
  };

  // Função para extrair apenas a rua do endereço
  const getRuaEndereco = (endereco: string) => {
    // Pega apenas a primeira parte antes da primeira vírgula
    return endereco.split(',')[0] || endereco;
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] py-6 lg:py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 lg:mb-12">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/WhatsApp Image 2025-06-20 at 14.53.40-Photoroom.png" 
              alt="Garagem 601 Logo" 
              className="h-10 w-10 lg:h-12 lg:w-12 mr-3 object-contain"
            />
            <h1 className="text-3xl lg:text-4xl font-bold text-white">
              {configuracoes.nome_oficina}
            </h1>
          </div>
          <p className="text-lg lg:text-xl text-gray-400">Consulta Pública de Serviços</p>
          <p className="text-gray-500 mt-2 text-sm lg:text-base">Digite a placa do seu veículo para acompanhar o andamento do serviço</p>
        </div>

        {/* Botão voltar quando há resultado */}
        {(consulta || notFound) && (
          <div className="mb-6">
            <Button
              onClick={voltarParaInicio}
              variant="secondary"
              icon={ArrowLeft}
              size="sm"
            >
              Nova Consulta
            </Button>
          </div>
        )}

        {/* Formulário de consulta */}
        {!consulta && !notFound && (
          <Card className="mb-8">
            <div className="p-6 lg:p-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <label htmlFor="placa" className="block text-sm font-medium text-gray-300 mb-2">
                    Placa do Veículo
                  </label>
                  <div className="relative">
                    <input
                      id="placa"
                      type="text"
                      value={placa}
                      onChange={handlePlacaChange}
                      onKeyPress={handleKeyPress}
                      placeholder="AAA-0000"
                      maxLength={8}
                      className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white text-lg font-mono tracking-wider placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                    <Car className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  </div>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={handleConsulta}
                    disabled={!placa.trim() || loading}
                    icon={Search}
                    size="lg"
                    className="px-8 w-full md:w-auto"
                  >
                    {loading ? 'Consultando...' : 'Consultar'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Resultado da consulta */}
        {consulta && (
          <div className="space-y-6">
            {/* Informações do veículo */}
            <Card>
              <div className="p-6 lg:p-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Imagem do veículo */}
                  <div className="lg:col-span-1">
                    {consulta.veiculo.imagem_url ? (
                      <img
                        src={consulta.veiculo.imagem_url}
                        alt={`${consulta.veiculo.marca} ${consulta.veiculo.modelo}`}
                        className="w-full h-48 object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-48 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
                        <Car className="h-16 w-16 text-gray-500" />
                      </div>
                    )}
                  </div>

                  {/* Informações do veículo */}
                  <div className="lg:col-span-2">
                    <div className="mb-4">
                      <h2 className="text-xl lg:text-2xl font-bold text-white mb-2">
                        {consulta.veiculo.marca} {consulta.veiculo.modelo}
                      </h2>
                      <div className="flex flex-wrap items-center space-x-4 text-gray-300 text-sm lg:text-base">
                        <span className="text-lg font-mono">{consulta.veiculo.placa}</span>
                        <span>•</span>
                        <span>{consulta.veiculo.ano}</span>
                        <span>•</span>
                        <span>{consulta.veiculo.cor}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center text-gray-300">
                        <User className="h-5 w-5 mr-2 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-400">Proprietário</p>
                          <p className="font-medium">{consulta.cliente.nome}</p>
                        </div>
                      </div>
                      <div className="flex items-center text-gray-300">
                        <Phone className="h-5 w-5 mr-2 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-400">Contato</p>
                          <p className="font-medium">{consulta.cliente.telefone}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Status do serviço */}
            {consulta.agendamento ? (
              <Card>
                <div className="p-6 lg:p-8">
                  <h3 className="text-lg lg:text-xl font-semibold text-white mb-6 flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Status do Serviço
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Serviço</p>
                      <p className="text-lg font-medium text-white">{consulta.agendamento.titulo}</p>
                      {consulta.agendamento.descricao && (
                        <p className="text-gray-300 mt-1 text-sm">{consulta.agendamento.descricao}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Status Atual</p>
                      <div className="flex items-center">
                        {(() => {
                          const statusInfo = getStatusInfo(consulta.agendamento!.status);
                          const Icon = statusInfo.Icon;
                          return (
                            <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium ${statusInfo.color}`}>
                              <Icon className="h-4 w-4 mr-2" />
                              {statusInfo.label}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-[#1a1a1a] rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Data de Entrada</p>
                      <p className="font-medium text-white">
                        {new Date(consulta.agendamento.data_inicio).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="p-4 bg-[#1a1a1a] rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Previsão</p>
                      <p className="font-medium text-white text-sm">
                        {getPrevisaoEntrega(consulta.agendamento.status, consulta.agendamento.data_fim)}
                      </p>
                    </div>
                    <div className="p-4 bg-[#1a1a1a] rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Responsável</p>
                      <p className="font-medium text-white">
                        {consulta.agendamento.responsavel || 'Equipe técnica'}
                      </p>
                    </div>
                  </div>

                  {/* Data de finalização para status concluído */}
                  {(() => {
                    const dataFinalizacao = getDataFinalizacao(consulta.agendamento!.status, consulta.agendamento!.updated_at);
                    if (dataFinalizacao) {
                      return (
                        <div className="mt-4 p-4 bg-green-500 bg-opacity-10 border border-green-500 border-opacity-30 rounded-lg">
                          <div className="flex items-center text-green-400">
                            <CheckCircle className="h-5 w-5 mr-2" />
                            <span className="font-medium text-sm">{dataFinalizacao}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </Card>
            ) : (
              <Card>
                <div className="p-6 lg:p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <Calendar className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">Nenhum serviço em andamento</h3>
                  <p className="text-gray-400">
                    Este veículo não possui serviços agendados no momento.
                  </p>
                </div>
              </Card>
            )}

            {/* Orçamento vinculado */}
            {consulta.orcamento && (
              <Card>
                <div className="p-6 lg:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
                    <h3 className="text-lg lg:text-xl font-semibold text-white flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Orçamento - {consulta.orcamento.numero_orcamento}
                    </h3>
                    <div className="mt-2 sm:mt-0">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getOrcamentoStatusColor(consulta.orcamento.status)}`}>
                        {getOrcamentoStatusLabel(consulta.orcamento.status)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Descrição</p>
                      <p className="text-white">{consulta.orcamento.descricao}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Validade</p>
                      <p className="text-white">
                        {new Date(consulta.orcamento.data_vencimento).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {/* Status de pagamento */}
                  {consulta.orcamento.status === 'pago' && consulta.orcamento.data_pagamento && (
                    <div className="mb-6 p-4 bg-green-500 bg-opacity-10 border border-green-500 border-opacity-30 rounded-lg">
                      <div className="flex items-center text-green-400">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span className="font-medium text-sm">
                          Pagamento realizado em {new Date(consulta.orcamento.data_pagamento + 'T00:00:00').toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Itens do orçamento */}
                  {consulta.orcamento.itens && consulta.orcamento.itens.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-medium text-white mb-4">Itens e Serviços</h4>
                      <div className="space-y-2">
                        {consulta.orcamento.itens.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                            <div className="flex items-center space-x-3">
                              {item.tipo === 'peca' ? (
                                <Package className="h-4 w-4 text-red-400" />
                              ) : (
                                <Wrench className="h-4 w-4 text-green-400" />
                              )}
                              <div>
                                <p className="text-white font-medium text-sm">{item.nome}</p>
                                <p className="text-xs text-gray-400">
                                  {item.quantidade}x R$ {item.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                            </div>
                            <div className="text-white font-medium text-sm">
                              R$ {(item.quantidade * item.preco).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Total do orçamento */}
                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-white">Valor Total:</span>
                      <span className="text-xl lg:text-2xl font-bold text-green-400">
                        R$ {consulta.orcamento.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {consulta.orcamento.observacoes && (
                    <div className="mt-4 p-4 bg-[#1a1a1a] rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Observações</p>
                      <p className="text-white text-sm">{consulta.orcamento.observacoes}</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Informações adicionais */}
            <Card>
              <div className="p-4 lg:p-6 bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-red-400 mb-2">Informações Importantes</h4>
                    <ul className="text-sm text-gray-300 space-y-1">
                      <li>• Para retirada do veículo, traga documento com foto</li>
                      <li>• Em caso de dúvidas, entre em contato conosco: {configuracoes.telefone_oficina}</li>
                      <li>• Horário de funcionamento: {getHorarioFuncionamento()}</li>
                      <li>• Endereço: {configuracoes.endereco_oficina}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Veículo não encontrado */}
        {notFound && !loading && (
          <Card>
            <div className="p-8 lg:p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Search className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">Veículo não encontrado</h3>
              <p className="text-gray-400 max-w-md mx-auto text-sm lg:text-base">
                Não encontramos nenhum veículo cadastrado com a placa <strong>{placa}</strong>. 
                Verifique se digitou corretamente ou entre em contato conosco.
              </p>
              <div className="mt-6 p-4 bg-[#1a1a1a] rounded-lg">
                <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4 text-sm text-gray-300">
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-1" />
                    {configuracoes.telefone_oficina}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {getRuaEndereco(configuracoes.endereco_oficina || '')}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ConsultaPublica;