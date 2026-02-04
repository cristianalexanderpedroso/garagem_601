import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, AlertTriangle, Package, TrendingDown, TrendingUp, DollarSign, Save, X, Calculator, Tag } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';
import { useCategorias } from '../hooks/useCategorias';

interface ItemEstoque {
  id: string;
  nome: string;
  categoria: string;
  preco: number; // Preço de venda
  preco_custo: number; // Preço de custo
  quantidade: number;
  quantidade_minima: number;
  fornecedor: string;
  codigo_barras?: string;
  tipo: 'produto' | 'servico';
  created_at: string;
  updated_at: string;
}

const Estoque: React.FC = () => {
  const [estoque, setEstoque] = useState<ItemEstoque[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todas');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ItemEstoque | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();
  const { categorias, loading: loadingCategorias } = useCategorias();

  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    preco: 0,
    preco_custo: 0,
    quantidade: 0,
    quantidade_minima: 0,
    fornecedor: '',
    codigo_barras: ''
  });

  // Buscar apenas produtos do estoque (filtrar tipo = 'produto')
  const fetchEstoque = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('estoque')
        .select('*')
        .eq('tipo', 'produto') // Filtrar apenas produtos
        .order('nome');

      if (fetchError) throw fetchError;
      setEstoque(data || []);
    } catch (err) {
      console.error('Erro ao carregar estoque:', err);
      error('Erro ao carregar estoque', 'Não foi possível carregar os itens do estoque');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstoque();
  }, []);

  // Obter categorias únicas do estoque atual + categorias configuradas
  const categoriasDisponiveis = Array.from(new Set([
    ...categorias,
    ...estoque.map(item => item.categoria)
  ])).sort();

  const filteredEstoque = estoque.filter(item => {
    const matchesSearch = item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.fornecedor.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategoria = categoriaFilter === 'todas' || item.categoria === categoriaFilter;
    return matchesSearch && matchesCategoria;
  });

  const itensEstoqueBaixo = estoque.filter(item => 
    item.quantidade <= item.quantidade_minima
  );
  
  const valorTotalEstoque = estoque.reduce((acc, item) => 
    acc + (item.preco * item.quantidade), 0
  );

  const valorTotalCusto = estoque.reduce((acc, item) => 
    acc + (item.preco_custo * item.quantidade), 0
  );

  const margemLucro = valorTotalCusto > 0 ? ((valorTotalEstoque - valorTotalCusto) / valorTotalCusto) * 100 : 0;

  const getStatusEstoque = (item: ItemEstoque) => {
    if (item.quantidade === 0) {
      return { status: 'sem_estoque', color: 'text-red-400 bg-red-500 bg-opacity-20', icon: AlertTriangle };
    } else if (item.quantidade <= item.quantidade_minima) {
      return { status: 'estoque_baixo', color: 'text-yellow-400 bg-yellow-500 bg-opacity-20', icon: TrendingDown };
    } else {
      return { status: 'estoque_ok', color: 'text-green-400 bg-green-500 bg-opacity-20', icon: TrendingUp };
    }
  };

  const handleNovoItem = () => {
    setEditingItem(null);
    setFormData({
      nome: '',
      categoria: '',
      preco: 0,
      preco_custo: 0,
      quantidade: 0,
      quantidade_minima: 0,
      fornecedor: '',
      codigo_barras: ''
    });
    setShowModal(true);
  };

  const handleEditarItem = (item: ItemEstoque) => {
    setEditingItem(item);
    setFormData({
      nome: item.nome,
      categoria: item.categoria,
      preco: item.preco,
      preco_custo: item.preco_custo,
      quantidade: item.quantidade,
      quantidade_minima: item.quantidade_minima,
      fornecedor: item.fornecedor,
      codigo_barras: item.codigo_barras || ''
    });
    setShowModal(true);
  };

  const handleExcluirItem = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este item?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('estoque')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      success('Item excluído', 'Item removido do estoque com sucesso');
      await fetchEstoque();
    } catch (err) {
      console.error('Erro ao excluir item:', err);
      error('Erro ao excluir item', 'Não foi possível excluir o item');
    }
  };

  const handleSalvarItem = async (e: React.FormEvent) => {
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

      const itemData = {
        ...formData,
        tipo: 'produto' as const, // Sempre produto nesta tela
        codigo_barras: formData.codigo_barras || null
      };

      if (editingItem) {
        const { error: updateError } = await supabase
          .from('estoque')
          .update(itemData)
          .eq('id', editingItem.id);

        if (updateError) throw updateError;
        success('Item atualizado', 'Item do estoque atualizado com sucesso');
      } else {
        const { error: insertError } = await supabase
          .from('estoque')
          .insert([itemData]);

        if (insertError) throw insertError;
        success('Item adicionado', 'Novo item adicionado ao estoque');
      }

      setShowModal(false);
      await fetchEstoque();
    } catch (err) {
      console.error('Erro ao salvar item:', err);
      error('Erro ao salvar item', 'Não foi possível salvar o item');
    } finally {
      setSaving(false);
    }
  };

  // Calcular margem de lucro individual
  const calcularMargem = (precoVenda: number, precoCusto: number) => {
    if (precoCusto <= 0) return 0;
    return ((precoVenda - precoCusto) / precoCusto) * 100;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Controle de Estoque</h1>
        <Card>
          <div className="p-12 text-center">
            <div className="text-gray-400">Carregando estoque...</div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Controle de Estoque</h1>
        <Button icon={Plus} onClick={handleNovoItem}>
          Novo Produto
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total de Produtos</p>
                <p className="text-2xl font-bold text-white">{estoque.length}</p>
              </div>
              <div className="p-3 bg-red-500 bg-opacity-20 rounded-full">
                <Package className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Estoque Baixo</p>
                <p className="text-2xl font-bold text-white">{itensEstoqueBaixo.length}</p>
              </div>
              <div className="p-3 bg-yellow-500 bg-opacity-20 rounded-full">
                <AlertTriangle className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Valor Total (Venda)</p>
                <p className="text-2xl font-bold text-white">
                  R$ {valorTotalEstoque.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-green-500 bg-opacity-20 rounded-full">
                <DollarSign className="h-6 w-6 text-green-500" />
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
                  {margemLucro.toFixed(1)}%
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
                placeholder="Pesquisar produtos..."
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

      {/* Lista de produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEstoque.map((item) => {
          const statusInfo = getStatusEstoque(item);
          const StatusIcon = statusInfo.icon;
          const margem = calcularMargem(item.preco, item.preco_custo);
          
          return (
            <Card key={item.id} hover>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-semibold text-white">{item.nome}</h3>
                      <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {item.quantidade <= item.quantidade_minima ? 'Baixo' : 'OK'}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mb-1">
                      <Tag className="h-3 w-3 text-gray-400" />
                      <p className="text-sm text-gray-400">{item.categoria}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => handleEditarItem(item)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => handleExcluirItem(item.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Quantidade:</span>
                    <span className="text-lg font-semibold text-white">{item.quantidade}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Preço de venda:</span>
                    <span className="font-medium text-white">
                      R$ {item.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Preço de custo:</span>
                    <span className="font-medium text-gray-300">
                      R$ {item.preco_custo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Margem:</span>
                    <span className={`font-medium ${margem > 30 ? 'text-green-400' : margem > 15 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {margem.toFixed(1)}%
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Valor total:</span>
                    <span className="font-semibold text-green-400">
                      R$ {(item.preco * item.quantidade).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Estoque mínimo:</span>
                    <span className="text-sm text-gray-300">{item.quantidade_minima}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-400">
                    <span className="font-medium">Fornecedor:</span> {item.fornecedor}
                  </p>
                  {item.codigo_barras && (
                    <p className="text-xs text-gray-400 mt-1">
                      <span className="font-medium">Código:</span> {item.codigo_barras}
                    </p>
                  )}
                </div>

                {item.quantidade <= item.quantidade_minima && (
                  <div className="mt-4 p-3 bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30 rounded-lg">
                    <div className="flex items-center text-yellow-400">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      <span className="text-sm font-medium">
                        {item.quantidade === 0 ? 'Sem estoque!' : 'Estoque baixo!'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {filteredEstoque.length === 0 && (
        <Card>
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Package className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Nenhum produto encontrado</h3>
            <p className="text-gray-400">
              {searchTerm || categoriaFilter !== 'todas'
                ? 'Tente ajustar os filtros de pesquisa' 
                : 'Comece adicionando produtos ao estoque'}
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
                  {editingItem ? 'Editar Produto' : 'Novo Produto'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSalvarItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nome do Produto *</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Ex: Óleo Motor 15W40, Filtro de Ar"
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
                    <label className="block text-sm font-medium text-gray-300 mb-2">Fornecedor *</label>
                    <input
                      type="text"
                      value={formData.fornecedor}
                      onChange={(e) => setFormData(prev => ({ ...prev, fornecedor: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Nome do fornecedor"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Preço de Custo * <span className="text-xs text-gray-400">(valor pago ao fornecedor)</span>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Quantidade Atual</label>
                    <input
                      type="number"
                      value={formData.quantidade}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantidade: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Quantidade Mínima</label>
                    <input
                      type="number"
                      value={formData.quantidade_minima}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantidade_minima: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Código de Barras <span className="text-gray-500">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.codigo_barras}
                    onChange={(e) => setFormData(prev => ({ ...prev, codigo_barras: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Código de barras do produto"
                  />
                </div>

                {/* Mostrar margem de lucro */}
                {formData.preco > 0 && formData.preco_custo > 0 && (
                  <div className="p-4 bg-[#1a1a1a] rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Margem de Lucro:</span>
                      <span className={`font-medium ${
                        calcularMargem(formData.preco, formData.preco_custo) > 30 ? 'text-green-400' : 
                        calcularMargem(formData.preco, formData.preco_custo) > 15 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {calcularMargem(formData.preco, formData.preco_custo).toFixed(1)}%
                      </span>
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
                    {saving ? 'Salvando...' : (editingItem ? 'Atualizar' : 'Adicionar')}
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

export default Estoque;