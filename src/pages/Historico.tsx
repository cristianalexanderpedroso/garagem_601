import React, { useState } from 'react';
import { Search, Calendar, Wrench, Clock, CheckCircle, Car, Plus, Edit, Trash2, User, FileText } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { useHistorico } from '../hooks/useHistorico';
import { useToast } from '../hooks/useToast';

const Historico: React.FC = () => {
  const { historico, loading, salvarHistorico, excluirHistorico } = useHistorico();
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const { success, error } = useToast();

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'preventiva':
        return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'corretiva':
        return <Wrench className="h-4 w-4 text-red-500" />;
      case 'revisao':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'preventiva':
        return 'text-blue-400 bg-blue-500 bg-opacity-20';
      case 'corretiva':
        return 'text-red-400 bg-red-500 bg-opacity-20';
      case 'revisao':
        return 'text-green-400 bg-green-500 bg-opacity-20';
      default:
        return 'text-gray-400 bg-gray-500 bg-opacity-20';
    }
  };

  const filteredHistorico = historico.filter(item => {
    const veiculoInfo = `${item.veiculos.marca} ${item.veiculos.modelo} - ${item.veiculos.placa}`;
    const clienteNome = item.veiculos.clientes.nome;
    
    const matchesSearch = item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         veiculoInfo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.responsavel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTipo = tipoFilter === 'todos' || item.tipo === tipoFilter;
    return matchesSearch && matchesTipo;
  });

  const handleExcluirItem = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro do histórico?')) return;

    const sucesso = await excluirHistorico(id);
    if (sucesso) {
      success('Registro excluído', 'Registro removido do histórico com sucesso');
    } else {
      error('Erro ao excluir registro', 'Não foi possível excluir o registro');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Histórico de Manutenções</h1>
        <Card>
          <div className="p-12 text-center">
            <div className="text-gray-400">Carregando histórico...</div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Histórico de Manutenções</h1>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            icon={Plus} 
            size="sm"
            className="w-full sm:w-auto"
          >
            Novo Registro
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
        <Card>
          <div className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-400">Total</p>
                <p className="text-lg lg:text-2xl font-bold text-white">{historico.length}</p>
              </div>
              <div className="p-2 lg:p-3 bg-red-500 bg-opacity-20 rounded-full">
                <Clock className="h-4 w-4 lg:h-6 lg:w-6 text-red-500" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-400">Preventiva</p>
                <p className="text-lg lg:text-2xl font-bold text-white">
                  {historico.filter(h => h.tipo === 'preventiva').length}
                </p>
              </div>
              <div className="p-2 lg:p-3 bg-blue-500 bg-opacity-20 rounded-full">
                <Calendar className="h-4 w-4 lg:h-6 lg:w-6 text-blue-500" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-400">Corretiva</p>
                <p className="text-lg lg:text-2xl font-bold text-white">
                  {historico.filter(h => h.tipo === 'corretiva').length}
                </p>
              </div>
              <div className="p-2 lg:p-3 bg-red-500 bg-opacity-20 rounded-full">
                <Wrench className="h-4 w-4 lg:h-6 lg:w-6 text-red-500" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-4 lg:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs lg:text-sm font-medium text-gray-400">Revisões</p>
                <p className="text-lg lg:text-2xl font-bold text-white">
                  {historico.filter(h => h.tipo === 'revisao').length}
                </p>
              </div>
              <div className="p-2 lg:p-3 bg-green-500 bg-opacity-20 rounded-full">
                <CheckCircle className="h-4 w-4 lg:h-6 lg:w-6 text-green-500" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <div className="p-4 lg:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Pesquisar por veículo, cliente ou descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm lg:text-base"
              />
            </div>
            <select
              value={tipoFilter}
              onChange={(e) => setTipoFilter(e.target.value)}
              className="px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm lg:text-base"
            >
              <option value="todos">Todos os Tipos</option>
              <option value="preventiva">Preventiva</option>
              <option value="corretiva">Corretiva</option>
              <option value="revisao">Revisão</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Timeline de manutenções */}
      <div className="space-y-4">
        {filteredHistorico.map((item, index) => (
          <Card key={item.id} hover>
            <div className="p-4 lg:p-6">
              <div className="flex flex-col lg:flex-row lg:items-start space-y-4 lg:space-y-0 lg:space-x-4">
                {/* Timeline indicator */}
                <div className="flex lg:flex-col items-center lg:items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${getTipoColor(item.tipo)} border-2 border-current`}>
                    {getTipoIcon(item.tipo)}
                  </div>
                  {index !== filteredHistorico.length - 1 && (
                    <div className="hidden lg:block w-0.5 h-12 bg-gray-700 mt-2"></div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between mb-3 gap-4">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{item.descricao}</h3>
                        <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getTipoColor(item.tipo)} w-fit`}>
                          {getTipoIcon(item.tipo)}
                          <span className="ml-1 capitalize">{item.tipo}</span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center text-gray-400 space-y-1 sm:space-y-0 sm:space-x-4 text-sm">
                        <div className="flex items-center">
                          <Car className="h-4 w-4 mr-1" />
                          <span>{item.veiculos.marca} {item.veiculos.modelo} - {item.veiculos.placa}</span>
                        </div>
                        <span className="hidden sm:inline">•</span>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          <span>{item.veiculos.clientes.nome}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="text-right">
                        <p className="text-lg font-semibold text-white">
                          R$ {item.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-sm text-gray-400">
                          {new Date(item.data_realizacao).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          className="p-2 text-gray-400 hover:text-green-400 transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleExcluirItem(item.id)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-300 mb-1">Responsável:</p>
                      <p className="text-gray-400">{item.responsavel}</p>
                    </div>
                    {item.km && (
                      <div>
                        <p className="font-medium text-gray-300 mb-1">Quilometragem:</p>
                        <p className="text-gray-400">{item.km.toLocaleString('pt-BR')} km</p>
                      </div>
                    )}
                    {item.proxima_revisao && (
                      <div>
                        <p className="font-medium text-gray-300 mb-1">Próxima Revisão:</p>
                        <p className="text-gray-400">{new Date(item.proxima_revisao).toLocaleDateString('pt-BR')}</p>
                      </div>
                    )}
                    {item.orcamentos && (
                      <div>
                        <p className="font-medium text-gray-300 mb-1">Orçamento:</p>
                        <div className="flex items-center text-gray-400">
                          <FileText className="h-3 w-3 mr-1" />
                          <span>{item.orcamentos.numero_orcamento}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Itens realizados */}
                  <div className="border-t border-gray-700 pt-4">
                    <p className="font-medium text-gray-300 mb-3">Serviços Realizados:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {item.itens_realizados.map((itemRealizado, itemIndex) => (
                        <div key={itemIndex} className="flex items-center text-sm text-gray-300">
                          <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                          <span>{itemRealizado}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredHistorico.length === 0 && (
        <Card>
          <div className="p-8 lg:p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Clock className="h-8 w-8 lg:h-12 lg:w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Nenhum histórico encontrado</h3>
            <p className="text-gray-400 text-sm lg:text-base">
              {searchTerm || tipoFilter !== 'todos' 
                ? 'Tente ajustar os filtros de pesquisa' 
                : 'Histórico de manutenções aparecerá aqui conforme forem realizadas'}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default Historico;