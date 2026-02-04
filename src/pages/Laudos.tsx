import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Award, AlertTriangle, CheckCircle, X, Save, Upload, Image as ImageIcon, Printer } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import ConfirmModal from '../components/ConfirmModal';
import { useLaudos } from '../hooks/useLaudos';
import { useOrcamentos } from '../hooks/useOrcamentos';
import { useClientes } from '../hooks/useClientes';
import { useVeiculos } from '../hooks/useVeiculos';
import { useToast } from '../hooks/useToast';
import { useConfiguracoes } from '../hooks/useConfiguracoes';
import { supabase } from '../lib/supabase';

interface AnexoLaudo {
  id: string;
  arquivo_url: string;
  nome_arquivo: string;
  descricao: string;
  tamanho_arquivo: number;
  tipo_arquivo: string;
}

const Laudos: React.FC = () => {
  const { laudos, loading, salvarLaudo, excluirLaudo, gerarNumeroLaudo } = useLaudos();
  const { orcamentos } = useOrcamentos();
  const { clientes } = useClientes();
  const { veiculos, getVeiculosByCliente } = useVeiculos();
  const { configuracoes } = useConfiguracoes();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [editingLaudo, setEditingLaudo] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [anexos, setAnexos] = useState<AnexoLaudo[]>([]);
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    orcamento_id: '',
    cliente_id: '',
    veiculo_id: '',
    numero_laudo: '',
    tipo: 'tecnico' as 'tecnico' | 'vistoria' | 'pericia',
    descricao: '',
    condicao_geral: 'bom' as 'otimo' | 'bom' | 'regular' | 'ruim' | 'pessimo',
    itens_verificados: [''],
    recomendacoes: [''],
    responsavel_tecnico: ''
  });

  // Carregar anexos do laudo
  const carregarAnexos = async (laudoId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('laudos_anexos')
        .select('*')
        .eq('laudo_id', laudoId)
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

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      error('Arquivo inválido', 'Por favor, selecione apenas arquivos de imagem');
      return;
    }

    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      error('Arquivo muito grande', 'A imagem deve ter no máximo 10MB');
      return;
    }

    setUploadingFile(true);

    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${editingLaudo?.id || 'temp'}/${fileName}`;

      // Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('laudos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data } = supabase.storage
        .from('laudos')
        .getPublicUrl(filePath);

      // Adicionar anexo temporário à lista
      const novoAnexo: AnexoLaudo = {
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

  // Remover anexo
  const handleRemoverAnexo = async (anexoId: string) => {
    if (!confirm('Tem certeza que deseja remover este anexo?')) return;

    try {
      // Se é um anexo já salvo no banco, remover do banco
      if (editingLaudo) {
        const { error: deleteError } = await supabase
          .from('laudos_anexos')
          .delete()
          .eq('id', anexoId);

        if (deleteError) throw deleteError;
      }

      // Remover da lista local
      setAnexos(prev => prev.filter(anexo => anexo.id !== anexoId));
      success('Anexo removido', 'Anexo removido com sucesso');
    } catch (err) {
      console.error('Erro ao remover anexo:', err);
      error('Erro ao remover anexo', 'Não foi possível remover o anexo');
    }
  };

  // Atualizar descrição do anexo
  const handleDescricaoAnexoChange = (anexoId: string, descricao: string) => {
    setAnexos(prev => prev.map(anexo => 
      anexo.id === anexoId ? { ...anexo, descricao } : anexo
    ));
  };

  const filteredLaudos = laudos.filter(laudo => {
    const searchLower = searchTerm.toLowerCase();
    return laudo.numero_laudo.toLowerCase().includes(searchLower) ||
           laudo.descricao.toLowerCase().includes(searchLower) ||
           laudo.responsavel_tecnico.toLowerCase().includes(searchLower);
  });

  const getCondicaoIcon = (condicao: string) => {
    switch (condicao) {
      case 'otimo':
      case 'bom':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'regular':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'ruim':
      case 'pessimo':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getCondicaoColor = (condicao: string) => {
    switch (condicao) {
      case 'otimo':
        return 'text-green-400 bg-green-500 bg-opacity-20';
      case 'bom':
        return 'text-green-400 bg-green-500 bg-opacity-20';
      case 'regular':
        return 'text-yellow-400 bg-yellow-500 bg-opacity-20';
      case 'ruim':
        return 'text-red-400 bg-red-500 bg-opacity-20';
      case 'pessimo':
        return 'text-red-400 bg-red-500 bg-opacity-20';
      default:
        return 'text-gray-400 bg-gray-500 bg-opacity-20';
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'tecnico':
        return <Award className="h-4 w-4 text-red-500" />;
      case 'vistoria':
        return <Eye className="h-4 w-4 text-purple-500" />;
      case 'pericia':
        return <Search className="h-4 w-4 text-orange-500" />;
      default:
        return <Award className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleNovoLaudo = async () => {
    const numeroLaudo = await gerarNumeroLaudo();
    setEditingLaudo(null);
    setAnexos([]);
    setFormData({
      orcamento_id: '',
      cliente_id: '',
      veiculo_id: '',
      numero_laudo: numeroLaudo,
      tipo: 'tecnico',
      descricao: '',
      condicao_geral: 'bom',
      itens_verificados: [''],
      recomendacoes: [''],
      responsavel_tecnico: ''
    });
    setShowModal(true);
  };

  const handleEditarLaudo = async (laudo: any) => {
    setEditingLaudo(laudo);
    await carregarAnexos(laudo.id);
    setFormData({
      orcamento_id: laudo.orcamento_id || '',
      cliente_id: laudo.cliente_id || '',
      veiculo_id: laudo.veiculo_id || '',
      numero_laudo: laudo.numero_laudo,
      tipo: laudo.tipo,
      descricao: laudo.descricao,
      condicao_geral: laudo.condicao_geral,
      itens_verificados: laudo.itens_verificados.length > 0 ? laudo.itens_verificados : [''],
      recomendacoes: laudo.recomendacoes.length > 0 ? laudo.recomendacoes : [''],
      responsavel_tecnico: laudo.responsavel_tecnico
    });
    setShowModal(true);
  };

  const handleExcluirLaudo = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este laudo?')) return;

    const sucesso = await excluirLaudo(id);
    if (sucesso) {
      success('Laudo excluído', 'Laudo removido com sucesso');
    } else {
      error('Erro ao excluir laudo', 'Não foi possível excluir o laudo');
    }
  };

  const handleSalvarLaudo = async (e: React.FormEvent) => {
    e.preventDefault();

    // Verificar se tem orçamento selecionado
    if (!formData.orcamento_id && !formData.cliente_id) {
      setShowConfirmModal(true);
      return;
    }

    await salvarLaudoFinal();
  };

  const salvarLaudoFinal = async () => {
    setSaving(true);

    try {
      const laudoData = {
        ...formData,
        orcamento_id: formData.orcamento_id || null,
        cliente_id: formData.cliente_id || null,
        veiculo_id: formData.veiculo_id || null,
        itens_verificados: formData.itens_verificados.filter(item => item.trim() !== ''),
        recomendacoes: formData.recomendacoes.filter(rec => rec.trim() !== ''),
        fotos: anexos.map(anexo => anexo.arquivo_url)
      };

      const sucesso = await salvarLaudo(laudoData, editingLaudo?.id);

      if (sucesso) {
        // Salvar anexos se for um novo laudo ou se houve mudanças
        if (anexos.length > 0) {
          // Buscar o ID do laudo recém-criado se for novo
          let laudoId = editingLaudo?.id;
          
          if (!laudoId) {
            const { data: laudoRecemCriado } = await supabase
              .from('laudos')
              .select('id')
              .eq('numero_laudo', formData.numero_laudo)
              .single();
            
            laudoId = laudoRecemCriado?.id;
          }

          // Salvar anexos no banco
          for (const anexo of anexos) {
            // Verificar se o anexo já existe no banco
            const { data: anexoExistente } = await supabase
              .from('laudos_anexos')
              .select('id')
              .eq('arquivo_url', anexo.arquivo_url)
              .single();

            if (!anexoExistente && laudoId) {
              await supabase
                .from('laudos_anexos')
                .insert([{
                  laudo_id: laudoId,
                  arquivo_url: anexo.arquivo_url,
                  nome_arquivo: anexo.nome_arquivo,
                  descricao: anexo.descricao,
                  tamanho_arquivo: anexo.tamanho_arquivo,
                  tipo_arquivo: anexo.tipo_arquivo
                }]);
            } else if (anexoExistente) {
              // Atualizar descrição se mudou
              await supabase
                .from('laudos_anexos')
                .update({ descricao: anexo.descricao })
                .eq('id', anexoExistente.id);
            }
          }
        }

        success(
          editingLaudo ? 'Laudo atualizado' : 'Laudo criado',
          editingLaudo ? 'Laudo atualizado com sucesso' : 'Novo laudo criado com sucesso'
        );
        setShowModal(false);
      } else {
        error('Erro ao salvar laudo', 'Não foi possível salvar o laudo');
      }
    } catch (err) {
      console.error('Erro ao salvar laudo:', err);
      error('Erro ao salvar laudo', 'Não foi possível salvar o laudo');
    } finally {
      setSaving(false);
    }
  };

  const gerarPDF = async (laudo: any) => {
    setGeneratingPdf(true);
    
    try {
      // Carregar anexos do laudo
      const { data: anexosData } = await supabase
        .from('laudos_anexos')
        .select('*')
        .eq('laudo_id', laudo.id)
        .order('created_at', { ascending: false });
      
      // Dados da oficina das configurações
      const nomeOficina = configuracoes.nome_oficina || 'Garagem 601';
      const razaoSocial = configuracoes.razao_social || 'GARAGEM 601 - CENTRO AUTOMOTIVO LTDA';
      const cnpj = configuracoes.cnpj_oficina || '';
      const inscricaoEstadual = configuracoes.inscricao_estadual || '';
      const telefone = configuracoes.telefone_oficina || '(11) 99999-0000';
      const email = configuracoes.email_oficina || 'contato@garagem601.com';
      const endereco = configuracoes.endereco_oficina || 'Rua da Oficina, 601 - São Paulo/SP';
      const logoUrl = configuracoes.logo_oficina || '';

      // Obter informações do cliente e veículo
      let clienteNome = 'Cliente não informado';
      let veiculoInfo = 'Veículo não informado';

      if (laudo.orcamentos) {
        clienteNome = laudo.orcamentos.clientes?.nome || clienteNome;
        const veiculo = laudo.orcamentos.veiculos;
        if (veiculo) {
          veiculoInfo = `${veiculo.marca} ${veiculo.modelo} - ${veiculo.placa}`;
        }
      } else if (laudo.clientes) {
        clienteNome = laudo.clientes.nome;
        if (laudo.veiculos) {
          veiculoInfo = `${laudo.veiculos.marca} ${laudo.veiculos.modelo} - ${laudo.veiculos.placa}`;
        }
      }

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Laudo ${laudo.numero_laudo}</title>
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
              grid-template-columns: 1fr 1fr 1fr;
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
            
            .content-section {
              background: #f8fafc;
              border: 2px solid #dc2626;
              border-radius: 12px;
              padding: 15px;
              margin-bottom: 20px;
            }
            
            .content-section h3 {
              color: #dc2626;
              font-size: 14px;
              margin-bottom: 10px;
            }
            
            .items-list {
              list-style: none;
              padding: 0;
            }
            
            .items-list li {
              padding: 5px 0;
              border-bottom: 1px solid #e5e7eb;
              font-size: 12px;
            }
            
            .items-list li:last-child {
              border-bottom: none;
            }
            
            .anexos-section {
              background: #f8fafc;
              border: 2px solid #dc2626;
              border-radius: 12px;
              padding: 15px;
              margin-bottom: 20px;
            }
            
            .anexos-section h3 {
              color: #dc2626;
              font-size: 14px;
              margin-bottom: 15px;
            }
            
            .anexos-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 15px;
            }
            
            .anexo-item {
              background: white;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 10px;
              text-align: center;
            }
            
            .anexo-item img {
              width: 100%;
              height: 120px;
              object-fit: cover;
              border-radius: 6px;
              margin-bottom: 8px;
            }
            
            .anexo-nome {
              font-size: 11px;
              font-weight: bold;
              color: #333;
              margin-bottom: 4px;
            }
            
            .anexo-descricao {
              font-size: 10px;
              color: #666;
              line-height: 1.3;
            }
            
            .footer {
              text-align: center;
              font-size: 10px;
              color: #666;
              border-top: 1px solid #e5e7eb;
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
                      ${cnpj ? `CNPJ: ${cnpj}<br>` : ''}
                      ${inscricaoEstadual ? `IE: ${inscricaoEstadual}<br>` : ''}
                      ${telefone} | ${email}
                    </div>
                  </div>
                </div>
                <div style="text-align: right;">
                  <div style="font-size: 18px; font-weight: bold;">LAUDO TÉCNICO</div>
                  <div style="font-size: 14px; opacity: 0.9;">${laudo.numero_laudo}</div>
                </div>
              </div>
            </div>

            <!-- Informações em 3 colunas -->
            <div class="info-grid">
              <!-- Dados do Laudo -->
              <div class="info-section">
                <h3>Dados do Laudo</h3>
                <div class="info-row">
                  <div class="info-label">Número:</div>
                  <div class="info-value">${laudo.numero_laudo}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Tipo:</div>
                  <div class="info-value">${laudo.tipo.charAt(0).toUpperCase() + laudo.tipo.slice(1)}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Data:</div>
                  <div class="info-value">${new Date(laudo.created_at).toLocaleDateString('pt-BR')}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Condição:</div>
                  <div class="info-value">${laudo.condicao_geral.charAt(0).toUpperCase() + laudo.condicao_geral.slice(1)}</div>
                </div>
              </div>

              <!-- Dados do Cliente -->
              <div class="info-section">
                <h3>Dados do Cliente</h3>
                <div class="info-row">
                  <div class="info-label">Nome:</div>
                  <div class="info-value">${clienteNome}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Veículo:</div>
                  <div class="info-value">${veiculoInfo}</div>
                </div>
                ${laudo.orcamentos ? `
                  <div class="info-row">
                    <div class="info-label">Orçamento:</div>
                    <div class="info-value">${laudo.orcamentos.numero_orcamento}</div>
                  </div>
                ` : ''}
              </div>

              <!-- Dados do Responsável -->
              <div class="info-section">
                <h3>Responsável Técnico</h3>
                <div class="info-row">
                  <div class="info-label">Nome:</div>
                  <div class="info-value">${laudo.responsavel_tecnico}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Data:</div>
                  <div class="info-value">${new Date(laudo.created_at).toLocaleDateString('pt-BR')}</div>
                </div>
              </div>
            </div>

            <!-- Descrição -->
            <div class="content-section">
              <h3>Descrição do Laudo</h3>
              <p>${laudo.descricao}</p>
            </div>

            <!-- Itens Verificados -->
            ${laudo.itens_verificados.length > 0 ? `
              <div class="content-section">
                <h3>Itens Verificados</h3>
                <ul class="items-list">
                  ${laudo.itens_verificados.map(item => `<li>✓ ${item}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            <!-- Recomendações -->
            ${laudo.recomendacoes.length > 0 ? `
              <div class="content-section">
                <h3>Recomendações</h3>
                <ul class="items-list">
                  ${laudo.recomendacoes.map(rec => `<li>⚠ ${rec}</li>`).join('')}
                </ul>
              </div>
            ` : ''}

            ${anexosData && anexosData.length > 0 ? `
              <div class="anexos-section">
                <h3>Anexos e Imagens</h3>
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
              <p style="margin-top: 10px;">Laudo gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</p>
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

        success('PDF gerado', 'Laudo aberto para impressão/salvamento');
      } else {
        // Método 2: Fallback - criar blob e download direto
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        // Criar link temporário para download
        const link = document.createElement('a');
        link.href = url;
        link.download = `laudo-${laudo.numero_laudo}.html`;
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
      error('Erro ao gerar PDF', 'Não foi possível gerar o PDF do laudo');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const addItemVerificado = () => {
    setFormData(prev => ({
      ...prev,
      itens_verificados: [...prev.itens_verificados, '']
    }));
  };

  const removeItemVerificado = (index: number) => {
    setFormData(prev => ({
      ...prev,
      itens_verificados: prev.itens_verificados.filter((_, i) => i !== index)
    }));
  };

  const updateItemVerificado = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      itens_verificados: prev.itens_verificados.map((item, i) => i === index ? value : item)
    }));
  };

  const addRecomendacao = () => {
    setFormData(prev => ({
      ...prev,
      recomendacoes: [...prev.recomendacoes, '']
    }));
  };

  const removeRecomendacao = (index: number) => {
    setFormData(prev => ({
      ...prev,
      recomendacoes: prev.recomendacoes.filter((_, i) => i !== index)
    }));
  };

  const updateRecomendacao = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      recomendacoes: prev.recomendacoes.map((rec, i) => i === index ? value : rec)
    }));
  };

  // Filtrar veículos por cliente selecionado
  const veiculosFiltrados = formData.cliente_id 
    ? getVeiculosByCliente(formData.cliente_id)
    : veiculos;

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Laudos Técnicos</h1>
        <Card>
          <div className="p-12 text-center">
            <div className="text-gray-400">Carregando laudos...</div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Laudos Técnicos</h1>
        <Button icon={Plus} onClick={handleNovoLaudo}>
          Novo Laudo
        </Button>
      </div>

      {/* Barra de pesquisa */}
      <Card>
        <div className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Pesquisar laudos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>
      </Card>

      {/* Lista de laudos */}
      <div className="space-y-4">
        {filteredLaudos.map((laudo) => (
          <Card key={laudo.id} hover>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-white">{laudo.numero_laudo}</h3>
                    <div className="flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500 bg-opacity-20 text-red-400">
                      {getTipoIcon(laudo.tipo)}
                      <span className="ml-1 capitalize">{laudo.tipo}</span>
                    </div>
                    <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCondicaoColor(laudo.condicao_geral)}`}>
                      {getCondicaoIcon(laudo.condicao_geral)}
                      <span className="ml-1 capitalize">{laudo.condicao_geral}</span>
                    </div>
                  </div>
                  <p className="text-gray-300 mb-3">{laudo.descricao}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-400">
                    {laudo.orcamentos && (
                      <p><span className="font-medium">Orçamento:</span> {laudo.orcamentos.numero_orcamento}</p>
                    )}
                    <p><span className="font-medium">Responsável:</span> {laudo.responsavel_tecnico}</p>
                    <p><span className="font-medium">Data:</span> {new Date(laudo.created_at).toLocaleDateString('pt-BR')}</p>
                    <p><span className="font-medium">Itens verificados:</span> {laudo.itens_verificados.length}</p>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => gerarPDF(laudo)}
                    disabled={generatingPdf}
                    className="p-2 text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-50"
                    title="Gerar PDF"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleEditarLaudo(laudo)}
                    className="p-2 text-gray-400 hover:text-green-400 transition-colors"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleExcluirLaudo(laudo.id)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Itens verificados */}
              {laudo.itens_verificados.length > 0 && (
                <div className="border-t border-gray-700 pt-4 mb-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Itens Verificados:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {laudo.itens_verificados.slice(0, 4).map((item, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-300">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                        {item}
                      </div>
                    ))}
                    {laudo.itens_verificados.length > 4 && (
                      <p className="text-xs text-gray-400 col-span-full">
                        +{laudo.itens_verificados.length - 4} itens adicionais
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Recomendações */}
              {laudo.recomendacoes.length > 0 && (
                <div className="border-t border-gray-700 pt-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Recomendações:</h4>
                  <div className="space-y-2">
                    {laudo.recomendacoes.slice(0, 2).map((recomendacao, index) => (
                      <div key={index} className="flex items-start text-sm text-gray-300">
                        <AlertTriangle className="h-3 w-3 text-yellow-500 mr-2 mt-0.5 flex-shrink-0" />
                        {recomendacao}
                      </div>
                    ))}
                    {laudo.recomendacoes.length > 2 && (
                      <p className="text-xs text-gray-400">
                        +{laudo.recomendacoes.length - 2} recomendações adicionais
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filteredLaudos.length === 0 && (
        <Card>
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Award className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Nenhum laudo encontrado</h3>
            <p className="text-gray-400">
              {searchTerm ? 'Tente ajustar os termos de pesquisa' : 'Comece criando um novo laudo técnico'}
            </p>
          </div>
        </Card>
      )}

      {/* Modal de formulário */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  {editingLaudo ? 'Editar Laudo' : 'Novo Laudo'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSalvarLaudo} className="space-y-6">
                {/* Informações básicas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Número do Laudo *</label>
                    <input
                      type="text"
                      value={formData.numero_laudo}
                      onChange={(e) => setFormData(prev => ({ ...prev, numero_laudo: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Laudo *</label>
                    <select
                      value={formData.tipo}
                      onChange={(e) => setFormData(prev => ({ ...prev, tipo: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    >
                      <option value="tecnico">Técnico</option>
                      <option value="vistoria">Vistoria</option>
                      <option value="pericia">Perícia</option>
                    </select>
                  </div>
                </div>

                {/* Orçamento ou Cliente/Veículo */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Orçamento (opcional)</label>
                    <select
                      value={formData.orcamento_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, orcamento_id: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Selecione um orçamento</option>
                      {orcamentos.map(orcamento => (
                        <option key={orcamento.id} value={orcamento.id}>
                          {orcamento.numero_orcamento} - {orcamento.clientes.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Cliente (se sem orçamento)</label>
                    <select
                      value={formData.cliente_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, cliente_id: e.target.value, veiculo_id: '' }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      disabled={!!formData.orcamento_id}
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
                    <label className="block text-sm font-medium text-gray-300 mb-2">Veículo (se sem orçamento)</label>
                    <select
                      value={formData.veiculo_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, veiculo_id: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      disabled={!!formData.orcamento_id || !formData.cliente_id}
                    >
                      <option value="">Selecione um veículo</option>
                      {veiculosFiltrados.map(veiculo => (
                        <option key={veiculo.id} value={veiculo.id}>
                          {veiculo.marca} {veiculo.modelo} - {veiculo.placa}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Descrição e condição */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Descrição *</label>
                    <textarea
                      value={formData.descricao}
                      onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows={4}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Condição Geral *</label>
                    <select
                      value={formData.condicao_geral}
                      onChange={(e) => setFormData(prev => ({ ...prev, condicao_geral: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    >
                      <option value="otimo">Ótimo</option>
                      <option value="bom">Bom</option>
                      <option value="regular">Regular</option>
                      <option value="ruim">Ruim</option>
                      <option value="pessimo">Péssimo</option>
                    </select>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Responsável Técnico *</label>
                      <input
                        type="text"
                        value={formData.responsavel_tecnico}
                        onChange={(e) => setFormData(prev => ({ ...prev, responsavel_tecnico: e.target.value }))}
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Itens verificados */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-300">Itens Verificados</label>
                    <Button type="button" size="sm" onClick={addItemVerificado}>
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.itens_verificados.map((item, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => updateItemVerificado(index, e.target.value)}
                          className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="Item verificado"
                        />
                        {formData.itens_verificados.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItemVerificado(index)}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recomendações */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-300">Recomendações</label>
                    <Button type="button" size="sm" onClick={addRecomendacao}>
                      <Plus className="h-3 w-3 mr-1" />
                      Adicionar
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {formData.recomendacoes.map((recomendacao, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={recomendacao}
                          onChange={(e) => updateRecomendacao(index, e.target.value)}
                          className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="Recomendação"
                        />
                        {formData.recomendacoes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRecomendacao(index)}
                            className="p-2 text-red-400 hover:text-red-300 transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Anexos */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">Anexos e Imagens</label>
                  
                  {/* Upload de arquivo */}
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

                  {/* Lista de anexos */}
                  {anexos.length > 0 && (
                    <div className="space-y-3">
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
                              onChange={(e) => handleDescricaoAnexoChange(anexo.id, e.target.value)}
                              className="w-full px-2 py-1 bg-[#2a2a2a] border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                              placeholder="Descrição da imagem (opcional)"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoverAnexo(anexo.id)}
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
                    disabled={saving}
                  >
                    {saving ? 'Salvando...' : (editingLaudo ? 'Atualizar' : 'Criar')}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* Modal de confirmação */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={salvarLaudoFinal}
        title="Salvar sem orçamento?"
        message="Você está criando um laudo sem vincular a um orçamento. Deseja continuar mesmo assim?"
        confirmText="Sim, salvar"
        cancelText="Cancelar"
        type="warning"
      />
    </div>
  );
};

export default Laudos;