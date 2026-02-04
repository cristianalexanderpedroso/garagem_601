import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, FileText, Eye, Calendar, User, Car, Package, Wrench, X, Save, Upload, Minus, Calculator, Percent, CreditCard, Clock, CheckCircle, AlertCircle, Printer } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
}

interface Veiculo {
  id: string;
  cliente_id: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  cor: string;
}

interface Agendamento {
  id: string;
  titulo: string;
  data_inicio: string;
  data_fim: string;
  status: string;
  cliente_id: string;
  veiculo_id: string;
}

interface ItemEstoque {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  preco_custo: number;
  tipo: 'produto' | 'servico';
  quantidade: number;
}

interface ItemOrcamento {
  id?: string;
  estoque_id?: string;
  nome: string;
  quantidade: number;
  preco: number;
  tipo: 'peca' | 'servico';
  desconto?: number;
}

interface AnexoOrcamento {
  id: string;
  arquivo_url: string;
  nome_arquivo: string;
  descricao: string;
  tamanho_arquivo: number;
  tipo_arquivo: string;
}

interface Orcamento {
  id: string;
  numero_orcamento: string;
  cliente_id: string;
  veiculo_id: string;
  agendamento_id?: string;
  descricao: string;
  valor_total: number;
  status: 'pendente' | 'aprovado' | 'rejeitado' | 'em_andamento' | 'concluido' | 'pago';
  data_vencimento: string;
  data_pagamento?: string;
  observacoes?: string;
  created_at: string;
  clientes: Cliente;
  veiculos: Veiculo;
  agendamentos?: Agendamento;
}

const Orcamentos: React.FC = () => {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [estoque, setEstoque] = useState<ItemEstoque[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [showModal, setShowModal] = useState(false);
  const [editingOrcamento, setEditingOrcamento] = useState<Orcamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [anexos, setAnexos] = useState<AnexoOrcamento[]>([]);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    numero_orcamento: '',
    cliente_id: '',
    veiculo_id: '',
    agendamento_id: '',
    descricao: '',
    data_vencimento: '',
    data_pagamento: '',
    status: 'pendente' as const,
    observacoes: '',
    desconto_geral: 0
  });

  const [itensOrcamento, setItensOrcamento] = useState<ItemOrcamento[]>([]);

  // Buscar dados
  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [orcamentosRes, clientesRes, veiculosRes, agendamentosRes, estoqueRes] = await Promise.all([
        supabase
          .from('orcamentos')
          .select(`
            *,
            clientes (id, nome, email, telefone),
            veiculos (id, cliente_id, placa, marca, modelo, ano, cor),
            agendamentos!orcamentos_agendamento_id_fkey (id, titulo, data_inicio, data_fim, status, cliente_id, veiculo_id)
          `)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('clientes')
          .select('id, nome, email, telefone')
          .order('nome'),
        
        supabase
          .from('veiculos')
          .select('id, cliente_id, placa, marca, modelo, ano, cor')
          .order('placa'),
        
        supabase
          .from('agendamentos')
          .select('id, titulo, data_inicio, data_fim, status, cliente_id, veiculo_id')
          .neq('status', 'cancelado')
          .order('data_inicio', { ascending: false }),
        
        supabase
          .from('estoque')
          .select('id, nome, categoria, preco, preco_custo, tipo, quantidade')
          .order('nome')
      ]);

      if (orcamentosRes.error) throw orcamentosRes.error;
      if (clientesRes.error) throw clientesRes.error;
      if (veiculosRes.error) throw veiculosRes.error;
      if (agendamentosRes.error) throw agendamentosRes.error;
      if (estoqueRes.error) throw estoqueRes.error;

      setOrcamentos(orcamentosRes.data || []);
      setClientes(clientesRes.data || []);
      setVeiculos(veiculosRes.data || []);
      setAgendamentos(agendamentosRes.data || []);
      setEstoque(estoqueRes.data || []);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      error('Erro ao carregar dados', 'Não foi possível carregar os dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Gerar número do orçamento
  const gerarNumeroOrcamento = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('orcamentos')
        .select('numero_orcamento')
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      const ano = new Date().getFullYear();
      let proximoNumero = 1;

      if (data && data.length > 0) {
        const ultimoNumero = data[0].numero_orcamento;
        const match = ultimoNumero.match(/ORC-(\d{4})-(\d{3})/);
        if (match && match[1] === ano.toString()) {
          proximoNumero = parseInt(match[2]) + 1;
        }
      }

      return `ORC-${ano}-${proximoNumero.toString().padStart(3, '0')}`;
    } catch (err) {
      console.error('Erro ao gerar número do orçamento:', err);
      return `ORC-${new Date().getFullYear()}-001`;
    }
  };

  // Carregar itens do orçamento
  const carregarItensOrcamento = async (orcamentoId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('itens_orcamento')
        .select('*')
        .eq('orcamento_id', orcamentoId);

      if (fetchError) throw fetchError;
      setItensOrcamento(data || []);
    } catch (err) {
      console.error('Erro ao carregar itens:', err);
    }
  };

  // Carregar anexos do orçamento
  const carregarAnexos = async (orcamentoId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('orcamentos_anexos')
        .select('*')
        .eq('orcamento_id', orcamentoId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setAnexos(data || []);
    } catch (err) {
      console.error('Erro ao carregar anexos:', err);
    }
  };

  // Upload de arquivo
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      error('Arquivo inválido', 'Por favor, selecione apenas arquivos de imagem');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      error('Arquivo muito grande', 'A imagem deve ter no máximo 10MB');
      return;
    }

    setUploadingFile(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${editingOrcamento?.id || 'temp'}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('orcamentos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('orcamentos')
        .getPublicUrl(filePath);

      const novoAnexo: AnexoOrcamento = {
        id: Math.random().toString(36).substring(2),
        arquivo_url: data.publicUrl,
        nome_arquivo: file.name,
        descricao: '',
        tamanho_arquivo: file.size,
        tipo_arquivo: file.type
      };

      setAnexos(prev => [...prev, novoAnexo]);
      success('Imagem carregada', 'Imagem adicionada com sucesso');
    } catch (err) {
      console.error('Erro ao fazer upload da imagem:', err);
      error('Erro no upload', 'Não foi possível carregar a imagem');
    } finally {
      setUploadingFile(false);
    }
  };

  // Adicionar produto ao orçamento
  const adicionarProduto = () => {
    setItensOrcamento(prev => [...prev, {
      nome: '',
      quantidade: 1,
      preco: 0,
      tipo: 'peca',
      desconto: 0
    }]);
  };

  // Adicionar serviço ao orçamento
  const adicionarServico = () => {
    setItensOrcamento(prev => [...prev, {
      nome: '',
      quantidade: 1,
      preco: 0,
      tipo: 'servico',
      desconto: 0
    }]);
  };

  // Remover item do orçamento
  const removerItem = (index: number) => {
    setItensOrcamento(prev => prev.filter((_, i) => i !== index));
  };

  // Atualizar item do orçamento
  const atualizarItem = (index: number, campo: keyof ItemOrcamento, valor: any) => {
    setItensOrcamento(prev => prev.map((item, i) => {
      if (i === index) {
        const novoItem = { ...item, [campo]: valor };
        
        // Se selecionou um item do estoque, preencher automaticamente
        if (campo === 'estoque_id' && valor) {
          const itemEstoque = estoque.find(e => e.id === valor);
          if (itemEstoque) {
            novoItem.nome = itemEstoque.nome;
            novoItem.preco = itemEstoque.preco;
            novoItem.tipo = itemEstoque.tipo === 'produto' ? 'peca' : 'servico';
          }
        }
        
        return novoItem;
      }
      return item;
    }));
  };

  // Calcular valor total
  const calcularValorTotal = () => {
    const subtotal = itensOrcamento.reduce((acc, item) => {
      const valorItem = item.quantidade * item.preco;
      const desconto = (item.desconto || 0) / 100;
      return acc + (valorItem * (1 - desconto));
    }, 0);
    
    const descontoGeral = (formData.desconto_geral || 0) / 100;
    return subtotal * (1 - descontoGeral);
  };

  // Filtrar dados
  const veiculosFiltrados = formData.cliente_id 
    ? veiculos.filter(v => v.cliente_id === formData.cliente_id)
    : veiculos;

  const agendamentosFiltrados = formData.cliente_id && formData.veiculo_id
    ? agendamentos.filter(a => a.cliente_id === formData.cliente_id && a.veiculo_id === formData.veiculo_id)
    : agendamentos;

  // Filtrar produtos e serviços do estoque
  const produtosEstoque = estoque.filter(item => item.tipo === 'produto');
  const servicosEstoque = estoque.filter(item => item.tipo === 'servico');

  const filteredOrcamentos = orcamentos.filter(orcamento => {
    const matchesSearch = orcamento.numero_orcamento.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         orcamento.clientes.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         orcamento.descricao.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || orcamento.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Handlers
  const handleNovoOrcamento = async () => {
    const numeroOrcamento = await gerarNumeroOrcamento();
    const dataVencimento = new Date();
    dataVencimento.setDate(dataVencimento.getDate() + 30);
    
    setEditingOrcamento(null);
    setItensOrcamento([]);
    setAnexos([]);
    setFormData({
      numero_orcamento: numeroOrcamento,
      cliente_id: '',
      veiculo_id: '',
      agendamento_id: '',
      descricao: '',
      data_vencimento: dataVencimento.toISOString().split('T')[0],
      data_pagamento: '',
      status: 'pendente',
      observacoes: '',
      desconto_geral: 0
    });
    setShowModal(true);
  };

  const handleEditarOrcamento = async (orcamento: Orcamento) => {
    setEditingOrcamento(orcamento);
    await carregarItensOrcamento(orcamento.id);
    await carregarAnexos(orcamento.id);
    
    setFormData({
      numero_orcamento: orcamento.numero_orcamento,
      cliente_id: orcamento.cliente_id,
      veiculo_id: orcamento.veiculo_id,
      agendamento_id: orcamento.agendamento_id || '',
      descricao: orcamento.descricao,
      data_vencimento: orcamento.data_vencimento,
      data_pagamento: orcamento.data_pagamento || '',
      status: orcamento.status,
      observacoes: orcamento.observacoes || '',
      desconto_geral: 0
    });
    setShowModal(true);
  };

  const handleExcluirOrcamento = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este orçamento?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('orcamentos')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      success('Orçamento excluído', 'Orçamento removido com sucesso');
      await fetchData();
    } catch (err) {
      console.error('Erro ao excluir orçamento:', err);
      error('Erro ao excluir orçamento', 'Não foi possível excluir o orçamento');
    }
  };

  const handleSalvarOrcamento = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (itensOrcamento.length === 0) {
        error('Itens obrigatórios', 'Adicione pelo menos um item ao orçamento');
        return;
      }

      const valorTotal = calcularValorTotal();
      
      const orcamentoData = {
        ...formData,
        valor_total: valorTotal,
        data_pagamento: formData.data_pagamento || null,
        agendamento_id: formData.agendamento_id || null
      };

      let orcamentoId = editingOrcamento?.id;

      if (editingOrcamento) {
        const { error: updateError } = await supabase
          .from('orcamentos')
          .update(orcamentoData)
          .eq('id', editingOrcamento.id);

        if (updateError) throw updateError;

        // Remover itens existentes
        await supabase
          .from('itens_orcamento')
          .delete()
          .eq('orcamento_id', editingOrcamento.id);
      } else {
        const { data: novoOrcamento, error: insertError } = await supabase
          .from('orcamentos')
          .insert([orcamentoData])
          .select()
          .single();

        if (insertError) throw insertError;
        orcamentoId = novoOrcamento.id;
      }

      // Inserir itens
      if (orcamentoId) {
        const itensParaInserir = itensOrcamento.map(item => ({
          orcamento_id: orcamentoId,
          estoque_id: item.estoque_id || null,
          nome: item.nome,
          quantidade: item.quantidade,
          preco: item.preco,
          tipo: item.tipo
        }));

        const { error: itensError } = await supabase
          .from('itens_orcamento')
          .insert(itensParaInserir);

        if (itensError) throw itensError;

        // Salvar anexos
        for (const anexo of anexos) {
          const { data: anexoExistente } = await supabase
            .from('orcamentos_anexos')
            .select('id')
            .eq('arquivo_url', anexo.arquivo_url)
            .single();

          if (!anexoExistente) {
            await supabase
              .from('orcamentos_anexos')
              .insert([{
                orcamento_id: orcamentoId,
                arquivo_url: anexo.arquivo_url,
                nome_arquivo: anexo.nome_arquivo,
                descricao: anexo.descricao,
                tamanho_arquivo: anexo.tamanho_arquivo,
                tipo_arquivo: anexo.tipo_arquivo
              }]);
          }
        }
      }

      success(
        editingOrcamento ? 'Orçamento atualizado' : 'Orçamento criado',
        editingOrcamento ? 'Orçamento atualizado com sucesso' : 'Novo orçamento criado com sucesso'
      );
      setShowModal(false);
      await fetchData();
    } catch (err) {
      console.error('Erro ao salvar orçamento:', err);
      error('Erro ao salvar orçamento', 'Não foi possível salvar o orçamento');
    } finally {
      setSaving(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'aprovado':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'em_andamento':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'concluido':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pago':
        return <CreditCard className="h-4 w-4 text-green-600" />;
      case 'rejeitado':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'text-yellow-400 bg-yellow-500 bg-opacity-20';
      case 'aprovado':
        return 'text-green-400 bg-green-500 bg-opacity-20';
      case 'em_andamento':
        return 'text-blue-400 bg-blue-500 bg-opacity-20';
      case 'concluido':
        return 'text-green-400 bg-green-500 bg-opacity-20';
      case 'pago':
        return 'text-green-600 bg-green-600 bg-opacity-20';
      case 'rejeitado':
        return 'text-red-400 bg-red-500 bg-opacity-20';
      default:
        return 'text-gray-400 bg-gray-500 bg-opacity-20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pendente':
        return 'Pendente';
      case 'aprovado':
        return 'Aprovado';
      case 'em_andamento':
        return 'Em Andamento';
      case 'concluido':
        return 'Concluído';
      case 'pago':
        return 'Pago';
      case 'rejeitado':
        return 'Rejeitado';
      default:
        return status;
    }
  };

  // Gerar PDF do orçamento
  const gerarPDF = async (orcamento: Orcamento) => {
    setGeneratingPdf(true);
    
    try {
      // Carregar itens do orçamento
      const { data: itensData, error: itensError } = await supabase
        .from('itens_orcamento')
        .select('*')
        .eq('orcamento_id', orcamento.id);
      
      if (itensError) throw itensError;
      
      // Carregar anexos do orçamento
      const { data: anexosData, error: anexosError } = await supabase
        .from('orcamentos_anexos')
        .select('*')
        .eq('orcamento_id', orcamento.id)
        .order('created_at', { ascending: false });
      
      if (anexosError) throw anexosError;
      
      // Carregar configurações da empresa
      const { data: configData, error: configError } = await supabase
        .from('configuracoes')
        .select('chave, valor')
        .in('chave', [
          'nome_oficina', 
          'razao_social', 
          'cnpj_oficina', 
          'inscricao_estadual',
          'telefone_oficina', 
          'email_oficina', 
          'endereco_oficina',
          'logo_oficina'
        ]);
      
      if (configError) throw configError;
      
      // Converter configurações para objeto
      const config: Record<string, string> = {};
      configData?.forEach(item => {
        config[item.chave] = item.valor;
      });
      
      // Dados da oficina
      const nomeOficina = config.nome_oficina || 'Garagem 601';
      const razaoSocial = config.razao_social || 'GARAGEM 601 - CENTRO AUTOMOTIVO LTDA';
      const cnpj = config.cnpj_oficina || '';
      const inscricaoEstadual = config.inscricao_estadual || '';
      const telefone = config.telefone_oficina || '(11) 99999-0000';
      const email = config.email_oficina || 'contato@garagem601.com';
      const endereco = config.endereco_oficina || 'Rua da Oficina, 601 - São Paulo/SP';
      const logoUrl = config.logo_oficina || '';
      
      // Calcular subtotal e total com descontos
      let subtotal = 0;
      const itens = itensData || [];
      
      itens.forEach(item => {
        subtotal += item.quantidade * item.preco;
      });
      
      // Gerar HTML do PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Orçamento ${orcamento.numero_orcamento}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              line-height: 1.4;
              color: #333;
              background: #fff;
            }
            
            .container {
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            
            .header {
              background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
              color: white;
              padding: 15px 20px;
              border-radius: 12px;
              margin-bottom: 20px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            
            .header-content {
              display: flex;
              align-items: center;
              justify-content: space-between;
            }
            
            .logo-section {
              display: flex;
              align-items: center;
              gap: 15px;
            }
            
            .logo {
              width: 50px;
              height: 50px;
              object-fit: contain;
              background: white;
              border-radius: 8px;
              padding: 5px;
            }
            
            .company-info h1 {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 3px;
            }
            
            .company-details {
              font-size: 11px;
              opacity: 0.9;
              line-height: 1.3;
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 20px;
            }
            
            .info-section {
              background: #f8fafc;
              border: 2px solid #dc2626;
              border-radius: 12px;
              padding: 15px;
            }
            
            .info-section h3 {
              color: #dc2626;
              font-size: 14px;
              font-weight: bold;
              margin-bottom: 10px;
              border-bottom: 1px solid #dc2626;
              padding-bottom: 5px;
            }
            
            .info-row {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
              margin-bottom: 8px;
            }
            
            .info-row:last-child {
              margin-bottom: 0;
            }
            
            .info-label {
              font-size: 11px;
              color: #666;
              font-weight: 500;
            }
            
            .info-value {
              font-size: 12px;
              color: #333;
              font-weight: 600;
            }
            
            .items-section {
              margin-bottom: 20px;
            }
            
            .items-section h3 {
              color: #dc2626;
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
              padding-bottom: 5px;
              border-bottom: 2px solid #dc2626;
            }
            
            .items-table {
              width: 100%;
              border-collapse: collapse;
            }
            
            .items-table th {
              background: #f1f5f9;
              padding: 8px;
              text-align: left;
              font-size: 12px;
              color: #334155;
              border-bottom: 1px solid #cbd5e1;
            }
            
            .items-table td {
              padding: 8px;
              font-size: 12px;
              border-bottom: 1px solid #e2e8f0;
            }
            
            .items-table tr:last-child td {
              border-bottom: none;
            }
            
            .items-table .item-type {
              display: inline-block;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 10px;
              font-weight: 600;
            }
            
            .items-table .item-type.peca {
              background: #fee2e2;
              color: #b91c1c;
            }
            
            .items-table .item-type.servico {
              background: #dcfce7;
              color: #15803d;
            }
            
            .total-section {
              background: #f8fafc;
              border: 2px solid #dc2626;
              border-radius: 12px;
              padding: 15px;
              margin-bottom: 20px;
            }
            
            .total-row {
              display: flex;
              justify-content: space-between;
              padding: 5px 0;
              font-size: 14px;
            }
            
            .total-row.grand-total {
              border-top: 1px solid #cbd5e1;
              margin-top: 5px;
              padding-top: 10px;
              font-weight: bold;
              font-size: 18px;
              color: #dc2626;
            }
            
            .status-badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 600;
            }
            
            .status-badge.pendente {
              background: #fef9c3;
              color: #854d0e;
            }
            
            .status-badge.aprovado {
              background: #dcfce7;
              color: #15803d;
            }
            
            .status-badge.em_andamento {
              background: #dbeafe;
              color: #1d4ed8;
            }
            
            .status-badge.concluido {
              background: #dcfce7;
              color: #15803d;
            }
            
            .status-badge.pago {
              background: #bbf7d0;
              color: #166534;
            }
            
            .status-badge.rejeitado {
              background: #fee2e2;
              color: #b91c1c;
            }
            
            .observations {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 15px;
              margin-bottom: 20px;
            }
            
            .observations h3 {
              color: #334155;
              font-size: 14px;
              margin-bottom: 8px;
            }
            
            .observations p {
              font-size: 12px;
              color: #475569;
            }
            
            .anexos-section {
              margin-bottom: 20px;
            }
            
            .anexos-section h3 {
              color: #dc2626;
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
              padding-bottom: 5px;
              border-bottom: 2px solid #dc2626;
            }
            
            .anexos-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 15px;
            }
            
            .anexo-item {
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 10px;
              text-align: center;
            }
            
            .anexo-item img {
              width: 100%;
              height: 100px;
              object-fit: cover;
              border-radius: 6px;
              margin-bottom: 8px;
            }
            
            .anexo-nome {
              font-size: 11px;
              font-weight: bold;
              color: #334155;
              margin-bottom: 4px;
            }
            
            .anexo-descricao {
              font-size: 10px;
              color: #64748b;
            }
            
            .footer {
              text-align: center;
              font-size: 10px;
              color: #64748b;
              border-top: 1px solid #e2e8f0;
              padding-top: 15px;
            }
            
            @media print {
              body { margin: 0; }
              .container { padding: 10px; }
              .header { margin-bottom: 15px; }
              .info-grid { gap: 15px; margin-bottom: 15px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <!-- Cabeçalho -->
            <div class="header">
              <div class="header-content">
                <div class="logo-section">
                  ${logoUrl ? `<img src="${logoUrl}" alt="Logo" class="logo" />` : ''}
                  <div class="company-info">
                    <h1>${nomeOficina}</h1>
                    <div class="company-details">
                      ${razaoSocial}<br>
                      ${cnpj ? `CNPJ: ${cnpj}<br>` : ''}
                      ${inscricaoEstadual ? `IE: ${inscricaoEstadual}<br>` : ''}
                      ${telefone} | ${email}
                    </div>
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 18px; font-weight: bold;">ORÇAMENTO</div>
                  <div style="font-size: 14px; opacity: 0.9;">${orcamento.numero_orcamento}</div>
                </div>
              </div>
            </div>

            <!-- Informações do cliente e veículo -->
            <div class="info-grid">
              <div class="info-section">
                <h3>Dados do Cliente</h3>
                <div class="info-row">
                  <div class="info-label">Nome:</div>
                  <div class="info-value">${orcamento.clientes.nome}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Email:</div>
                  <div class="info-value">${orcamento.clientes.email}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Telefone:</div>
                  <div class="info-value">${orcamento.clientes.telefone}</div>
                </div>
              </div>

              <div class="info-section">
                <h3>Dados do Veículo</h3>
                <div class="info-row">
                  <div class="info-label">Veículo:</div>
                  <div class="info-value">${orcamento.veiculos.marca} ${orcamento.veiculos.modelo}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Placa:</div>
                  <div class="info-value">${orcamento.veiculos.placa}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Ano/Cor:</div>
                  <div class="info-value">${orcamento.veiculos.ano} / ${orcamento.veiculos.cor}</div>
                </div>
              </div>
            </div>

            <!-- Informações do orçamento -->
            <div class="info-grid">
              <div class="info-section">
                <h3>Dados do Orçamento</h3>
                <div class="info-row">
                  <div class="info-label">Número:</div>
                  <div class="info-value">${orcamento.numero_orcamento}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Data:</div>
                  <div class="info-value">${new Date(orcamento.created_at).toLocaleDateString('pt-BR')}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Validade:</div>
                  <div class="info-value">${new Date(orcamento.data_vencimento).toLocaleDateString('pt-BR')}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Status:</div>
                  <div class="info-value">
                    <span class="status-badge ${orcamento.status}">
                      ${getStatusLabel(orcamento.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div class="info-section">
                <h3>Descrição do Serviço</h3>
                <p style="font-size: 12px;">${orcamento.descricao}</p>
                ${orcamento.agendamentos ? `
                  <div style="margin-top: 10px; font-size: 11px;">
                    <strong>Agendamento:</strong> ${orcamento.agendamentos.titulo}<br>
                    <strong>Data:</strong> ${new Date(orcamento.agendamentos.data_inicio).toLocaleDateString('pt-BR')}
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Itens do orçamento -->
            <div class="items-section">
              <h3>Itens do Orçamento</h3>
              <table class="items-table">
                <thead>
                  <tr>
                    <th style="width: 5%;">Tipo</th>
                    <th style="width: 45%;">Descrição</th>
                    <th style="width: 10%;">Qtd</th>
                    <th style="width: 15%;">Preço Unit.</th>
                    <th style="width: 10%;">Desconto</th>
                    <th style="width: 15%;">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  ${itens.map(item => {
                    const valorUnitario = item.preco;
                    const valorTotal = item.quantidade * valorUnitario;
                    return `
                      <tr>
                        <td>
                          <span class="item-type ${item.tipo}">
                            ${item.tipo === 'peca' ? 'Peça' : 'Serviço'}
                          </span>
                        </td>
                        <td>${item.nome}</td>
                        <td>${item.quantidade}</td>
                        <td>R$ ${valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td>${item.desconto || 0}%</td>
                        <td>R$ ${valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>

            <!-- Total -->
            <div class="total-section">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>R$ ${subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div class="total-row grand-total">
                <span>Valor Total:</span>
                <span>R$ ${orcamento.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            <!-- Observações -->
            ${orcamento.observacoes ? `
              <div class="observations">
                <h3>Observações</h3>
                <p>${orcamento.observacoes}</p>
              </div>
            ` : ''}

            <!-- Anexos -->
            ${anexosData && anexosData.length > 0 ? `
              <div class="anexos-section">
                <h3>Anexos</h3>
                <div class="anexos-grid">
                  ${anexosData.map(anexo => `
                    <div class="anexo-item">
                      <img src="${anexo.arquivo_url}" alt="${anexo.nome_arquivo}" />
                      <div class="anexo-nome">${anexo.nome_arquivo}</div>
                      ${anexo.descricao ? `<div class="anexo-descricao">${anexo.descricao}</div>` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}

            <!-- Rodapé -->
            <div class="footer">
              <p><strong>${nomeOficina}</strong></p>
              <p>${endereco}</p>
              <p>Telefone: ${telefone} | Email: ${email}</p>
              <p style="margin-top: 10px;">Orçamento gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Tentar abrir nova janela primeiro
      let printWindow: Window | null = null;
      
      try {
        printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
      } catch (popupError) {
        console.warn('Popup bloqueado, tentando método alternativo:', popupError);
      }

      if (printWindow && !printWindow.closed) {
        // Método 1: Nova janela (funciona se popup não estiver bloqueado)
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        printWindow.onload = () => {
          setTimeout(() => {
            printWindow!.print();
          }, 500);
        };

        success('PDF gerado', 'Orçamento aberto para impressão/salvamento');
      } else {
        // Método 2: Fallback - criar blob e download direto
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        // Criar link temporário para download
        const link = document.createElement('a');
        link.href = url;
        link.download = `orcamento-${orcamento.numero_orcamento}.html`;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Limpar URL do blob
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        success('PDF baixado', 'Arquivo HTML baixado. Abra-o no navegador e use Ctrl+P para imprimir como PDF');
      }

    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      error('Erro ao gerar PDF', 'Não foi possível gerar o PDF do orçamento');
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Orçamentos</h1>
        <Card>
          <div className="p-12 text-center">
            <div className="text-gray-400">Carregando orçamentos...</div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Orçamentos</h1>
        <Button icon={Plus} onClick={handleNovoOrcamento}>
          Novo Orçamento
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total</p>
                <p className="text-2xl font-bold text-white">{orcamentos.length}</p>
              </div>
              <div className="p-3 bg-red-500 bg-opacity-20 rounded-full">
                <FileText className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Pendentes</p>
                <p className="text-2xl font-bold text-white">
                  {orcamentos.filter(o => o.status === 'pendente').length}
                </p>
              </div>
              <div className="p-3 bg-yellow-500 bg-opacity-20 rounded-full">
                <Clock className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Aprovados</p>
                <p className="text-2xl font-bold text-white">
                  {orcamentos.filter(o => o.status === 'aprovado').length}
                </p>
              </div>
              <div className="p-3 bg-green-500 bg-opacity-20 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Pagos</p>
                <p className="text-2xl font-bold text-white">
                  {orcamentos.filter(o => o.status === 'pago').length}
                </p>
              </div>
              <div className="p-3 bg-green-600 bg-opacity-20 rounded-full">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Pesquisar orçamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="todos">Todos os Status</option>
              <option value="pendente">Pendente</option>
              <option value="aprovado">Aprovado</option>
              <option value="em_andamento">Em Andamento</option>
              <option value="concluido">Concluído</option>
              <option value="pago">Pago</option>
              <option value="rejeitado">Rejeitado</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Lista de orçamentos */}
      <div className="space-y-4">
        {filteredOrcamentos.map((orcamento) => (
          <Card key={orcamento.id} hover>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{orcamento.numero_orcamento}</h3>
                    <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(orcamento.status)}`}>
                      {getStatusIcon(orcamento.status)}
                      <span className="ml-1">{getStatusLabel(orcamento.status)}</span>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-3">{orcamento.descricao}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-400">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      <span>{orcamento.clientes.nome}</span>
                    </div>
                    <div className="flex items-center">
                      <Car className="h-4 w-4 mr-1" />
                      <span>{orcamento.veiculos.marca} {orcamento.veiculos.modelo} - {orcamento.veiculos.placa}</span>
                    </div>
                    <p><span className="font-medium">Vencimento:</span> {new Date(orcamento.data_vencimento).toLocaleDateString('pt-BR')}</p>
                    {orcamento.data_pagamento && (
                      <p><span className="font-medium">Pago em:</span> {new Date(orcamento.data_pagamento).toLocaleDateString('pt-BR')}</p>
                    )}
                    {orcamento.agendamentos && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{orcamento.agendamentos.titulo}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-white">
                      R$ {orcamento.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-gray-400">
                      {new Date(orcamento.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => gerarPDF(orcamento)}
                      disabled={generatingPdf}
                      className="p-2 text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-50"
                      title="Gerar PDF"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleEditarOrcamento(orcamento)}
                      className="p-2 text-gray-400 hover:text-green-400 transition-colors"
                      title="Editar"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleExcluirOrcamento(orcamento.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredOrcamentos.length === 0 && (
        <Card>
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <FileText className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Nenhum orçamento encontrado</h3>
            <p className="text-gray-400">
              {searchTerm || statusFilter !== 'todos' 
                ? 'Tente ajustar os filtros de pesquisa' 
                : 'Comece criando um novo orçamento'}
            </p>
          </div>
        </Card>
      )}

      {/* Modal de formulário */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-6xl mx-4 max-h-[95vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  {editingOrcamento ? 'Editar Orçamento' : 'Novo Orçamento'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSalvarOrcamento} className="space-y-6">
                {/* Informações básicas */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Número do Orçamento *</label>
                    <input
                      type="text"
                      value={formData.numero_orcamento}
                      onChange={(e) => setFormData(prev => ({ ...prev, numero_orcamento: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Data de Vencimento *</label>
                    <input
                      type="date"
                      value={formData.data_vencimento}
                      onChange={(e) => setFormData(prev => ({ ...prev, data_vencimento: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Status *</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    >
                      <option value="pendente">Pendente</option>
                      <option value="aprovado">Aprovado</option>
                      <option value="em_andamento">Em Andamento</option>
                      <option value="concluido">Concluído</option>
                      <option value="pago">Pago</option>
                      <option value="rejeitado">Rejeitado</option>
                    </select>
                  </div>
                </div>

                {/* Data de pagamento (apenas se status for "pago") */}
                {formData.status === 'pago' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Data de Pagamento *</label>
                    <input
                      type="date"
                      value={formData.data_pagamento}
                      onChange={(e) => setFormData(prev => ({ ...prev, data_pagamento: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      required={formData.status === 'pago'}
                    />
                  </div>
                )}

                {/* Cliente, Veículo e Agendamento */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Cliente *</label>
                    <select
                      value={formData.cliente_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, cliente_id: e.target.value, veiculo_id: '', agendamento_id: '' }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    >
                      <option value="">Selecione um cliente</option>
                      {clientes.map(cliente => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Veículo *</label>
                    <select
                      value={formData.veiculo_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, veiculo_id: e.target.value, agendamento_id: '' }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                      disabled={!formData.cliente_id}
                    >
                      <option value="">Selecione um veículo</option>
                      {veiculosFiltrados.map(veiculo => (
                        <option key={veiculo.id} value={veiculo.id}>
                          {veiculo.marca} {veiculo.modelo} - {veiculo.placa}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Agendamento (opcional)</label>
                    <select
                      value={formData.agendamento_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, agendamento_id: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      disabled={!formData.veiculo_id}
                    >
                      <option value="">Selecione um agendamento</option>
                      {agendamentosFiltrados.map(agendamento => (
                        <option key={agendamento.id} value={agendamento.id}>
                          {agendamento.titulo} - {new Date(agendamento.data_inicio).toLocaleDateString('pt-BR')}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Descrição *</label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={3}
                    required
                  />
                </div>

                {/* Itens do orçamento */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Itens do Orçamento</h3>
                    <div className="flex space-x-2">
                      <Button type="button" onClick={adicionarProduto} icon={Package} size="sm" variant="secondary">
                        Adicionar Produto
                      </Button>
                      <Button type="button" onClick={adicionarServico} icon={Wrench} size="sm">
                        Adicionar Serviço
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {itensOrcamento.map((item, index) => (
                      <div key={index} className="p-4 bg-[#1a1a1a] rounded-lg border border-gray-700">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            {item.tipo === 'peca' ? (
                              <Package className="h-4 w-4 text-red-400" />
                            ) : (
                              <Wrench className="h-4 w-4 text-green-400" />
                            )}
                            <span className="text-sm font-medium text-white">
                              {item.tipo === 'peca' ? 'Produto' : 'Serviço'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removerItem(index)}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                              {item.tipo === 'peca' ? 'Produto do Estoque' : 'Serviço do Catálogo'}
                            </label>
                            <select
                              value={item.estoque_id || ''}
                              onChange={(e) => atualizarItem(index, 'estoque_id', e.target.value)}
                              className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                            >
                              <option value="">Selecionar do estoque</option>
                              {(item.tipo === 'peca' ? produtosEstoque : servicosEstoque).map(itemEstoque => (
                                <option key={itemEstoque.id} value={itemEstoque.id}>
                                  {itemEstoque.nome} - R$ {itemEstoque.preco.toFixed(2)}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Nome *</label>
                            <input
                              type="text"
                              value={item.nome}
                              onChange={(e) => atualizarItem(index, 'nome', e.target.value)}
                              className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Qtd *</label>
                            <input
                              type="number"
                              value={item.quantidade}
                              onChange={(e) => atualizarItem(index, 'quantidade', parseInt(e.target.value) || 1)}
                              className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                              min="1"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Preço *</label>
                            <input
                              type="number"
                              value={item.preco}
                              onChange={(e) => atualizarItem(index, 'preco', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                              step="0.01"
                              min="0"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Desc. %</label>
                            <input
                              type="number"
                              value={item.desconto || 0}
                              onChange={(e) => atualizarItem(index, 'desconto', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                              step="0.1"
                              min="0"
                              max="100"
                            />
                          </div>
                        </div>

                        <div className="mt-2 text-right">
                          <span className="text-sm text-gray-400">Subtotal: </span>
                          <span className="font-medium text-white">
                            R$ {((item.quantidade * item.preco) * (1 - (item.desconto || 0) / 100)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {itensOrcamento.length === 0 && (
                    <div className="p-8 text-center border border-dashed border-gray-700 rounded-lg">
                      <div className="text-gray-400 mb-3">
                        <FileText className="h-8 w-8 mx-auto" />
                      </div>
                      <p className="text-gray-300 mb-4">Nenhum item adicionado ao orçamento</p>
                      <div className="flex flex-col sm:flex-row justify-center gap-2">
                        <Button type="button" onClick={adicionarProduto} icon={Package} size="sm" variant="secondary">
                          Adicionar Produto
                        </Button>
                        <Button type="button" onClick={adicionarServico} icon={Wrench} size="sm">
                          Adicionar Serviço
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Desconto geral e total */}
                  {itensOrcamento.length > 0 && (
                    <div className="mt-6 p-4 bg-[#1a1a1a] rounded-lg border border-gray-700">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <label className="text-sm font-medium text-gray-300">Desconto Geral:</label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="number"
                              value={formData.desconto_geral}
                              onChange={(e) => setFormData(prev => ({ ...prev, desconto_geral: parseFloat(e.target.value) || 0 }))}
                              className="w-20 px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                              step="0.1"
                              min="0"
                              max="100"
                            />
                            <Percent className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-400">Valor Total:</p>
                          <p className="text-2xl font-bold text-green-400">
                            R$ {calcularValorTotal().toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Observações */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Observações</label>
                  <textarea
                    value={formData.observacoes}
                    onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    rows={3}
                  />
                </div>

                {/* Anexos */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Anexos e Imagens</label>
                  
                  <div className="mb-4">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-700 border-dashed rounded-lg cursor-pointer bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {uploadingFile ? (
                          <div className="text-gray-400">Carregando...</div>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 mb-2 text-gray-400" />
                            <p className="mb-2 text-sm text-gray-400">
                              <span className="font-semibold">Clique para enviar</span> ou arraste a imagem
                            </p>
                            <p className="text-xs text-gray-400">PNG, JPG ou JPEG (máx. 10MB)</p>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                        disabled={uploadingFile}
                      />
                    </label>
                  </div>

                  {anexos.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {anexos.map((anexo, index) => (
                        <div key={anexo.id} className="flex items-start space-x-3 p-3 bg-[#1a1a1a] rounded-lg border border-gray-700">
                          <img
                            src={anexo.arquivo_url}
                            alt={anexo.nome_arquivo}
                            className="w-16 h-16 object-cover rounded"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white mb-1">{anexo.nome_arquivo}</p>
                            <input
                              type="text"
                              value={anexo.descricao}
                              onChange={(e) => {
                                const novosAnexos = [...anexos];
                                novosAnexos[index].descricao = e.target.value;
                                setAnexos(novosAnexos);
                              }}
                              className="w-full px-2 py-1 bg-[#2a2a2a] border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                              placeholder="Descrição da imagem (opcional)"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setAnexos(prev => prev.filter(a => a.id !== anexo.id))}
                            className="p-1 text-red-400 hover:text-red-300 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowModal(false)}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    icon={Save}
                    disabled={saving || itensOrcamento.length === 0}
                  >
                    {saving ? 'Salvando...' : (editingOrcamento ? 'Atualizar' : 'Criar')}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Orcamentos;