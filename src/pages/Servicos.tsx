import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Wrench, DollarSign, TrendingUp, Clock, Save, X, Calculator, Percent, Tag } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { useServicos } from '../hooks/useServicos';
import { useCategorias } from '../hooks/useCategorias';
import { useToast } from '../hooks/useToast';

interface ServicoForm {
  nome: string;
  categoria: string;
  preco: number;
  preco_custo: number;
  fornecedor: string;
}

const Servicos: React.FC = () => {
  const { servicos, loading, salvarServico, excluirServico } = useServicos();
  const { categorias, loading: loadingCategorias } = useCategorias('servicos');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todas');
  const [showModal, setShowModal] = useState(false);
  const [editingServico, setEditingServico] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  const [formData, setFormData] = useState<ServicoForm>({
    nome: '',
    categoria: '',
    preco: 0,
    preco_custo: 0,
    fornecedor: 'Interno'
  });

  // Obter categorias únicas dos serviços + categorias configuradas
  const categoriasDisponiveis = Array.from(new Set([
    ...categorias,
    ...servicos.map(servico => servico.categoria)
  ])).sort();

  const filteredServicos = servicos.filter(servico => {
    const matchesSearch = servico.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         servico.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         servico.fornecedor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = categoriaFilter === 'todas' || servico.categoria === categoriaFilter;
    return matchesSearch && matchesCategoria;
  });

  // Estatísticas
  const totalServicos = servicos.length;
  const valorTotalServicos = servicos.reduce((acc, servico) => acc + servico.preco, 0);
  const margemMedia = servicos.length > 0 
    ? servicos.reduce((acc, servico) => {
        const margem = servico.preco_custo > 0 ? ((servico.preco - servico.preco_custo) / servico.preco_custo) * 100 : 0;
        return acc + margem;
      }, 0) / servicos.length
    : 0;

  const handleNovoServico = () => {
    setEditingServico(null);
    setFormData({
      nome: '',
      categoria: '',
      preco: 0,
      preco_custo: 0,
      fornecedor: 'Interno'
    });
    setShowModal(true);
  };

  const handleEditarServico = (servico: any) => {
    setEditingServico(servico);
    setFormData({
      nome: servico.nome,
      categoria: servico.categoria,
      preco: servico.preco,
      preco_custo: servico.preco_custo,
      fornecedor: servico.fornecedor
    });
    setShowModal(true);
  };

  const handleExcluirServico = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este serviço?')) return;

    const sucesso = await excluirServico(id);
    if (sucesso) {
      success('Serviço excluído', 'Serviço removido com sucesso');
    } else {
      error('Erro ao excluir serviço', 'Não foi possível excluir o serviço');
    }
  };

  const handleSalvarServico = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validações
      if (formData.preco <= 0) {
        error('Preço inválido', 'O preço de venda deve ser maior que zero');
        return;
      }

      if (formData.preco_custo <= 0) {
        error('Preço de custo inválido', 'O preço de custo deve ser maior que zero');
        return;
      }

      if (formData.preco_custo >= formData.preco) {
        error('Margem inválida', 'O preço de venda deve ser maior que o preço de custo');
        return;
      }

      const sucesso = await salvarServico(formData, editingServico?.id);
      
      if (sucesso) {
        success(
          editingServico ? 'Serviço atualizado' : 'Serviço criado',
          editingServico ? 'Serviço atualizado com sucesso' : 'Novo serviço adicionado'
        );
        setShowModal(false);
      } else {
        error('Erro ao salvar serviço', 'Não foi possível salvar o serviço');
      }
    } catch (err) {
      console.error('Erro ao salvar serviço:', err);
      error('Erro ao salvar serviço', 'Não foi possível salvar o serviço');
    } finally {
      setSaving(false);
    }
  };

  // Calcular margem de lucro
  const calcularMargem = (precoVenda: number, precoCusto: number) => {
    if (precoCusto <= 0) return 0;
    return ((precoVenda - precoCusto) / precoCusto) * 100;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Serviços</h1>
        <Card>
          <div className="p-12 text-center">
            <div className="text-gray-400">Carregando serviços...</div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Gestão de Serviços</h1>
        <Button icon={Plus} onClick={handleNovoServico}>
          Novo Serviço
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total de Serviços</p>
                <p className="text-2xl font-bold text-white">{totalServicos}</p>
              </div>
              <div className="p-3 bg-red-500 bg-opacity-20 rounded-full">
                <Wrench className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Categorias</p>
                <p className="text-2xl font-bold text-white">{categoriasDisponiveis.length}</p>
              </div>
              <div className="p-3 bg-green-500 bg-opacity-20 rounded-full">
                <Tag className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Valor Médio</p>
                <p className="text-2xl font-bold text-white">
                  R$ {totalServicos > 0 ? (valorTotalServicos / totalServicos).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}
                </p>
              </div>
              <div className="p-3 bg-yellow-500 bg-opacity-20 rounded-full">
                <DollarSign className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Margem Média</p>
                <p className="text-2xl font-bold text-white">
                  {margemMedia.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-purple-500 bg-opacity-20 rounded-full">
                <TrendingUp className="h-6 w-6 text-purple-500" />
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
                placeholder="Pesquisar serviços..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>
            <select
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value)}
              className="px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              disabled={loadingCategorias}
            >
              <option value="todas">Todas as Categorias</option>
              {categoriasDisponiveis.map(categoria => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>
          </div>
          {loadingCategorias && (
            <p className="text-xs text-gray-400 mt-2">
              Categorias podem ser gerenciadas nas Configurações
            </p>
          )}
        </div>
      </Card>

      {/* Lista de serviços */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServicos.map((servico) => {
          const margem = calcularMargem(servico.preco, servico.preco_custo);
          
          return (
            <Card key={servico.id} hover>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Wrench className="h-5 w-5 text-red-500" />
                      <h3 className="text-lg font-semibold text-white">{servico.nome}</h3>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <Tag className="h-3 w-3 text-gray-400" />
                      <p className="text-sm text-gray-400">{servico.categoria}</p>
                    </div>
                    <p className="text-xs text-gray-500">Fornecedor: {servico.fornecedor}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditarServico(servico)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleExcluirServico(servico.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Preço de venda:</span>
                    <span className="text-lg font-semibold text-white">
                      R$ {servico.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Preço de custo:</span>
                    <span className="font-medium text-gray-300">
                      R$ {servico.preco_custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Margem:</span>
                    <span className={`font-medium ${
                      margem > 50 ? 'text-green-400' : 
                      margem > 30 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {margem.toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Lucro unitário:</span>
                    <span className="font-semibold text-green-400">
                      R$ {(servico.preco - servico.preco_custo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className={`p-3 rounded-lg ${
                    margem > 50 ? 'bg-green-500 bg-opacity-10 border border-green-500 border-opacity-30' :
                    margem > 30 ? 'bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30' :
                    'bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30'
                  }`}>
                    <div className={`flex items-center text-sm ${
                      margem > 50 ? 'text-green-400' :
                      margem > 30 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      <Calculator className="h-4 w-4 mr-2" />
                      <span className="font-medium">
                        {margem > 50 ? 'Margem excelente' :
                         margem > 30 ? 'Margem boa' : 'Margem baixa'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filteredServicos.length === 0 && (
        <Card>
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Wrench className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Nenhum serviço encontrado</h3>
            <p className="text-gray-400">
              {searchTerm || categoriaFilter !== 'todas'
                ? 'Tente ajustar os filtros de pesquisa' 
                : 'Comece adicionando serviços ao sistema'}
            </p>
          </div>
        </Card>
      )}

      {/* Modal de formulário */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">
                  {editingServico ? 'Editar Serviço' : 'Novo Serviço'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSalvarServico} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Serviço *</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Ex: Troca de óleo, Alinhamento, Diagnóstico"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Categoria *</label>
                    {loadingCategorias ? (
                      <input
                        type="text"
                        value={formData.categoria}
                        onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Carregando categorias..."
                        required
                      />
                    ) : (
                      <select
                        value={formData.categoria}
                        onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        required
                      >
                        <option value="">Selecione uma categoria</option>
                        {categoriasDisponiveis.map(categoria => (
                          <option key={categoria} value={categoria}>
                            {categoria}
                          </option>
                        ))}
                      </select>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Categorias podem ser gerenciadas nas Configurações
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Fornecedor/Responsável *</label>
                    <input
                      type="text"
                      value={formData.fornecedor}
                      onChange={(e) => setFormData(prev => ({ ...prev, fornecedor: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Ex: Interno, Terceirizado"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Preço de Custo * <span className="text-xs text-gray-400">(mão de obra + materiais)</span>
                    </label>
                    <input
                      type="number"
                      value={formData.preco_custo}
                      onChange={(e) => setFormData(prev => ({ ...prev, preco_custo: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Preço de Venda * <span className="text-xs text-gray-400">(valor cobrado do cliente)</span>
                    </label>
                    <input
                      type="number"
                      value={formData.preco}
                      onChange={(e) => setFormData(prev => ({ ...prev, preco: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>

                {/* Mostrar margem de lucro */}
                {formData.preco > 0 && formData.preco_custo > 0 && (
                  <div className="p-4 bg-[#1a1a1a] rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-gray-400">Margem de Lucro</p>
                        <p className={`text-lg font-bold ${
                          calcularMargem(formData.preco, formData.preco_custo) > 50 ? 'text-green-400' : 
                          calcularMargem(formData.preco, formData.preco_custo) > 30 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {calcularMargem(formData.preco, formData.preco_custo).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Lucro Unitário</p>
                        <p className="text-lg font-bold text-green-400">
                          R$ {(formData.preco - formData.preco_custo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Markup</p>
                        <p className="text-lg font-bold text-blue-400">
                          {formData.preco_custo > 0 ? (formData.preco / formData.preco_custo).toFixed(2) : '0.00'}x
                        </p>
                      </div>
                    </div>
                  </div>
                )}

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
                    {saving ? 'Salvando...' : (editingServico ? 'Atualizar' : 'Adicionar')}
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

export default Servicos;