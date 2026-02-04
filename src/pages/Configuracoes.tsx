import React, { useState } from 'react';
import { Settings, Save, Clock, Building, Mail, Phone, MapPin, Calendar, Users, Package, FileText, Tag, CreditCard, Image, Upload, X } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import CategoriasManager from '../components/CategoriasManager';
import { useConfiguracoes } from '../hooks/useConfiguracoes';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';

const Configuracoes: React.FC = () => {
  const { configuracoes, loading, updateConfiguracao } = useConfiguracoes();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [showCategorias, setShowCategorias] = useState(false);
  const [tipoCategoria, setTipoCategoria] = useState<'estoque' | 'servicos'>('estoque');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const { success, error } = useToast();

  // Inicializar form data quando configurações carregarem
  React.useEffect(() => {
    if (configuracoes && Object.keys(formData).length === 0) {
      setFormData(configuracoes);
    }
  }, [configuracoes]);

  const handleInputChange = (chave: string, valor: string) => {
    setFormData(prev => ({ ...prev, [chave]: valor }));
  };

  const handleLogoUpload = async (file: File) => {
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      error('Arquivo inválido', 'Por favor, selecione apenas arquivos de imagem');
      return;
    }

    // Validar tamanho (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      error('Arquivo muito grande', 'A logo deve ter no máximo 2MB');
      return;
    }

    setUploadingLogo(true);

    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-oficina.${fileExt}`;
      const filePath = `configuracoes/${fileName}`;

      // Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, logo_oficina: data.publicUrl }));
      success('Logo carregada', 'Logo da oficina carregada com sucesso');
    } catch (err) {
      console.error('Erro ao fazer upload da logo:', err);
      error('Erro no upload', 'Não foi possível carregar a logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedMessage('');

    try {
      const promises = Object.entries(formData).map(([chave, valor]) => {
        if (configuracoes[chave] !== valor) {
          return updateConfiguracao(chave, valor);
        }
        return Promise.resolve(true);
      });

      await Promise.all(promises);
      setSavedMessage('Configurações salvas com sucesso!');
      
      setTimeout(() => setSavedMessage(''), 3000);
    } catch (error) {
      setSavedMessage('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const formatCNPJ = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica formatação CNPJ: 00.000.000/0000-00
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})/, '$1-$2');
  };

  const handleCNPJChange = (value: string) => {
    const formatted = formatCNPJ(value);
    setFormData(prev => ({ ...prev, cnpj_oficina: formatted }));
  };

  // Função para gerar texto de horário de funcionamento automaticamente
  const gerarHorarioFuncionamento = () => {
    const inicioSemana = formData.horario_inicio || '08:00';
    const fimSemana = formData.horario_fim || '18:00';
    const funcionaSabado = formData.funcionamento_sabado === 'true';
    const inicioSabado = formData.horario_sabado_inicio || '08:00';
    const fimSabado = formData.horario_sabado_fim || '12:00';

    let texto = `Segunda a Sexta das ${inicioSemana.replace(':', 'h')} às ${fimSemana.replace(':', 'h')}`;
    
    if (funcionaSabado) {
      texto += `, Sábado das ${inicioSabado.replace(':', 'h')} às ${fimSabado.replace(':', 'h')}`;
    }

    setFormData(prev => ({ ...prev, horario_funcionamento_texto: texto }));
  };

  // Atualizar texto automaticamente quando horários mudarem
  React.useEffect(() => {
    if (formData.horario_inicio || formData.horario_fim || formData.funcionamento_sabado) {
      gerarHorarioFuncionamento();
    }
  }, [
    formData.horario_inicio, 
    formData.horario_fim, 
    formData.funcionamento_sabado,
    formData.horario_sabado_inicio,
    formData.horario_sabado_fim
  ]);

  const configuracoesPorCategoria = {
    geral: [
      { chave: 'nome_oficina', label: 'Nome da Oficina', icon: Building, type: 'text' },
      { chave: 'razao_social', label: 'Razão Social', icon: Building, type: 'text' },
      { chave: 'cnpj_oficina', label: 'CNPJ', icon: CreditCard, type: 'cnpj' },
      { chave: 'inscricao_estadual', label: 'Inscrição Estadual', icon: FileText, type: 'text' },
      { chave: 'telefone_oficina', label: 'Telefone', icon: Phone, type: 'tel' },
      { chave: 'email_oficina', label: 'Email', icon: Mail, type: 'email' },
      { chave: 'endereco_oficina', label: 'Endereço', icon: MapPin, type: 'text' }
    ],
    calendario: [
      { chave: 'horario_inicio', label: 'Horário de Início (Seg-Sex)', icon: Clock, type: 'time' },
      { chave: 'horario_fim', label: 'Horário de Fim (Seg-Sex)', icon: Clock, type: 'time' },
      { chave: 'funcionamento_sabado', label: 'Funciona aos Sábados', icon: Calendar, type: 'boolean' },
      { chave: 'horario_sabado_inicio', label: 'Horário de Início (Sábado)', icon: Clock, type: 'time' },
      { chave: 'horario_sabado_fim', label: 'Horário de Fim (Sábado)', icon: Clock, type: 'time' },
      { chave: 'intervalo_agendamento', label: 'Intervalo de Agendamento (minutos)', icon: Calendar, type: 'number' }
    ],
    estoque: [
      { chave: 'alerta_estoque_baixo', label: 'Alertas de Estoque Baixo', icon: Package, type: 'boolean' },
      { chave: 'margem_minima_alerta', label: 'Margem Mínima para Alerta (%)', icon: Package, type: 'number' }
    ],
    servicos: [
      { chave: 'margem_padrao_servicos', label: 'Margem Padrão para Serviços (%)', icon: Settings, type: 'number' },
      { chave: 'tempo_garantia_servicos', label: 'Tempo de Garantia (dias)', icon: Clock, type: 'number' },
      { chave: 'desconto_maximo_servicos', label: 'Desconto Máximo (%)', icon: Package, type: 'number' }
    ]
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Configurações</h1>
        <Card>
          <div className="p-12 text-center">
            <div className="text-gray-400">Carregando configurações...</div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Configurações do Sistema</h1>
        <Button 
          icon={Save} 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      {savedMessage && (
        <Card>
          <div className={`p-4 ${savedMessage.includes('sucesso') ? 'bg-green-500 bg-opacity-20 border border-green-500 border-opacity-30' : 'bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30'}`}>
            <div className={`text-sm font-medium ${savedMessage.includes('sucesso') ? 'text-green-400' : 'text-red-400'}`}>
              {savedMessage}
            </div>
          </div>
        </Card>
      )}

      {/* Configurações Gerais da Oficina */}
      <Card>
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Building className="h-6 w-6 text-red-500 mr-3" />
            <h2 className="text-xl font-semibold text-white">Informações da Oficina</h2>
          </div>
          
          {/* Logo da Oficina */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <div className="flex items-center">
                <Image className="h-4 w-4 mr-2" />
                Logo da Oficina
              </div>
            </label>
            <div className="space-y-3">
              {formData.logo_oficina && (
                <div className="relative inline-block">
                  <img
                    src={formData.logo_oficina}
                    alt="Logo da oficina"
                    className="h-20 w-auto object-contain rounded-lg border border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, logo_oficina: '' }))}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center justify-center px-4 py-2 border border-gray-700 rounded-lg cursor-pointer bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-colors">
                  <Upload className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="text-sm text-gray-300">
                    {uploadingLogo ? 'Carregando...' : 'Escolher Logo'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleLogoUpload(file);
                    }}
                    disabled={uploadingLogo}
                  />
                </label>
                <p className="text-xs text-gray-400">
                  PNG, JPG ou JPEG (máx. 2MB)
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {configuracoesPorCategoria.geral.map(config => {
              const Icon = config.icon;
              return (
                <div key={config.chave}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <div className="flex items-center">
                      <Icon className="h-4 w-4 mr-2" />
                      {config.label}
                    </div>
                  </label>
                  {config.type === 'cnpj' ? (
                    <input
                      type="text"
                      value={formData[config.chave] || ''}
                      onChange={(e) => handleCNPJChange(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 font-mono"
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                    />
                  ) : (
                    <input
                      type={config.type}
                      value={formData[config.chave] || ''}
                      onChange={(e) => handleInputChange(config.chave, e.target.value)}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Configurações do Calendário */}
      <Card>
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Calendar className="h-6 w-6 text-green-500 mr-3" />
            <h2 className="text-xl font-semibold text-white">Configurações do Calendário</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {configuracoesPorCategoria.calendario.map(config => {
              const Icon = config.icon;
              return (
                <div key={config.chave}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <div className="flex items-center">
                      <Icon className="h-4 w-4 mr-2" />
                      {config.label}
                    </div>
                  </label>
                  {config.type === 'boolean' ? (
                    <select
                      value={formData[config.chave] || 'true'}
                      onChange={(e) => handleInputChange(config.chave, e.target.value)}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="true">Sim</option>
                      <option value="false">Não</option>
                    </select>
                  ) : (
                    <input
                      type={config.type}
                      value={formData[config.chave] || ''}
                      onChange={(e) => handleInputChange(config.chave, e.target.value)}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      min={config.type === 'number' ? '15' : undefined}
                      max={config.type === 'number' ? '120' : undefined}
                      disabled={config.chave.includes('sabado') && formData.funcionamento_sabado === 'false'}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Preview do horário de funcionamento */}
          <div className="mt-6 p-4 bg-green-500 bg-opacity-10 border border-green-500 border-opacity-30 rounded-lg">
            <div className="flex items-start">
              <Clock className="h-5 w-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-green-400 mb-2">Preview do Horário de Funcionamento</h4>
                <p className="text-sm text-gray-300">
                  {formData.horario_funcionamento_texto || 'Configure os horários acima para ver o preview'}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  Este texto será exibido na consulta pública para os clientes
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded-lg">
            <div className="flex items-start">
              <Calendar className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-400 mb-2">Informações sobre o Calendário</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• O horário de funcionamento define quando os agendamentos podem ser feitos</li>
                  <li>• O intervalo de agendamento determina a duração mínima de cada slot</li>
                  <li>• Intervalos menores permitem mais flexibilidade, mas podem sobrecarregar a agenda</li>
                  <li>• Configure se a oficina funciona aos sábados e defina horários específicos</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Configurações do Estoque */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Package className="h-6 w-6 text-yellow-500 mr-3" />
              <h2 className="text-xl font-semibold text-white">Configurações do Estoque</h2>
            </div>
            <Button
              variant="secondary"
              icon={Tag}
              onClick={() => {
                setTipoCategoria('estoque');
                setShowCategorias(true);
              }}
            >
              Gerenciar Categorias
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {configuracoesPorCategoria.estoque.map(config => {
              const Icon = config.icon;
              return (
                <div key={config.chave}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <div className="flex items-center">
                      <Icon className="h-4 w-4 mr-2" />
                      {config.label}
                    </div>
                  </label>
                  {config.type === 'boolean' ? (
                    <select
                      value={formData[config.chave] || 'true'}
                      onChange={(e) => handleInputChange(config.chave, e.target.value)}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    >
                      <option value="true">Ativado</option>
                      <option value="false">Desativado</option>
                    </select>
                  ) : (
                    <input
                      type={config.type}
                      value={formData[config.chave] || ''}
                      onChange={(e) => handleInputChange(config.chave, e.target.value)}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      min={config.type === 'number' ? '0' : undefined}
                      max={config.type === 'number' ? '100' : undefined}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Configurações de Serviços */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Settings className="h-6 w-6 text-purple-500 mr-3" />
              <h2 className="text-xl font-semibold text-white">Configurações de Serviços</h2>
            </div>
            <Button
              variant="secondary"
              icon={Tag}
              onClick={() => {
                setTipoCategoria('servicos');
                setShowCategorias(true);
              }}
            >
              Gerenciar Categorias
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {configuracoesPorCategoria.servicos.map(config => {
              const Icon = config.icon;
              return (
                <div key={config.chave}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <div className="flex items-center">
                      <Icon className="h-4 w-4 mr-2" />
                      {config.label}
                    </div>
                  </label>
                  <input
                    type={config.type}
                    value={formData[config.chave] || ''}
                    onChange={(e) => handleInputChange(config.chave, e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    min={config.type === 'number' ? '0' : undefined}
                    max={config.type === 'number' && config.chave.includes('desconto') ? '100' : undefined}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-4 bg-purple-500 bg-opacity-10 border border-purple-500 border-opacity-30 rounded-lg">
            <div className="flex items-start">
              <Settings className="h-5 w-5 text-purple-400 mr-3 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-purple-400 mb-2">Sobre as Configurações de Serviços</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• A margem padrão é aplicada automaticamente em novos serviços</li>
                  <li>• O tempo de garantia aparece nos orçamentos e laudos</li>
                  <li>• O desconto máximo limita os descontos aplicáveis</li>
                  <li>• Categorias podem ser personalizadas conforme necessário</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Modal de Categorias */}
      {showCategorias && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Gerenciar Categorias de {tipoCategoria === 'estoque' ? 'Estoque' : 'Serviços'}
                </h3>
                <button
                  onClick={() => setShowCategorias(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <CategoriasManager 
                tipo={tipoCategoria}
                onClose={() => setShowCategorias(false)} 
              />
            </div>
          </Card>
        </div>
      )}

      {/* Configurações do Sistema */}
      <Card>
        <div className="p-6">
          <div className="flex items-center mb-6">
            <Settings className="h-6 w-6 text-red-500 mr-3" />
            <h2 className="text-xl font-semibold text-white">Resumo do Sistema</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-4 bg-[#1a1a1a]">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold text-white">
                  {Object.keys(configuracoes).length}
                </span>
              </div>
              <p className="text-sm text-gray-400">Configurações Ativas</p>
            </Card>

            <Card className="p-4 bg-[#1a1a1a]">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold text-white">
                  {formData.horario_inicio && formData.horario_fim 
                    ? `${parseInt(formData.horario_fim.split(':')[0]) - parseInt(formData.horario_inicio.split(':')[0])}h`
                    : '10h'
                  }
                </span>
              </div>
              <p className="text-sm text-gray-400">Horas de Funcionamento</p>
            </Card>

            <Card className="p-4 bg-[#1a1a1a]">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold text-white">
                  {formData.intervalo_agendamento || '30'}min
                </span>
              </div>
              <p className="text-sm text-gray-400">Intervalo Padrão</p>
            </Card>

            <Card className="p-4 bg-[#1a1a1a]">
              <div className="flex items-center justify-between mb-2">
                <Building className="h-5 w-5 text-red-500" />
                <span className="text-sm font-bold text-white truncate">
                  {formData.nome_oficina || 'Garagem 601'}
                </span>
              </div>
              <p className="text-sm text-gray-400">Nome da Oficina</p>
            </Card>
          </div>
        </div>
      </Card>

      {/* Informações Adicionais */}
      <Card>
        <div className="p-6">
          <div className="flex items-center mb-4">
            <Settings className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg font-medium text-white">Informações do Sistema</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-300 mb-2">Funcionalidades Disponíveis</h4>
              <ul className="space-y-1 text-gray-400">
                <li className="flex items-center">
                  <Users className="h-3 w-3 mr-2 text-red-500" />
                  Gestão de Clientes
                </li>
                <li className="flex items-center">
                  <FileText className="h-3 w-3 mr-2 text-green-500" />
                  Orçamentos e Laudos
                </li>
                <li className="flex items-center">
                  <Package className="h-3 w-3 mr-2 text-yellow-500" />
                  Controle de Estoque
                </li>
                <li className="flex items-center">
                  <Calendar className="h-3 w-3 mr-2 text-purple-500" />
                  Sistema de Agendamentos
                </li>
                <li className="flex items-center">
                  <Tag className="h-3 w-3 mr-2 text-red-500" />
                  Categorias Personalizáveis
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-300 mb-2">Suporte e Ajuda</h4>
              <ul className="space-y-1 text-gray-400">
                <li>• Todas as alterações são salvas automaticamente</li>
                <li>• Configurações afetam todo o sistema</li>
                <li>• Backup automático das configurações</li>
                <li>• Categorias podem ser personalizadas</li>
                <li>• Logo e documentos da empresa</li>
                <li>• Horários de funcionamento configuráveis</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Configuracoes;