import React, { useState } from 'react';
import { Plus, X, Save, Tag, Edit2 } from 'lucide-react';
import Button from './Button';
import { useCategorias } from '../hooks/useCategorias';
import { useToast } from '../hooks/useToast';

interface CategoriasManagerProps {
  tipo?: 'estoque' | 'servicos';
  onClose?: () => void;
}

const CategoriasManager: React.FC<CategoriasManagerProps> = ({ 
  tipo = 'estoque', 
  onClose 
}) => {
  const { categorias, updateCategorias } = useCategorias(tipo);
  const [categoriasLocal, setCategoriasLocal] = useState<string[]>(categorias);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [editandoIndex, setEditandoIndex] = useState<number | null>(null);
  const [valorEdicao, setValorEdicao] = useState('');
  const [saving, setSaving] = useState(false);
  const { success, error } = useToast();

  React.useEffect(() => {
    setCategoriasLocal(categorias);
  }, [categorias]);

  const adicionarCategoria = () => {
    if (!novaCategoria.trim()) {
      error('Categoria vazia', 'Digite o nome da categoria');
      return;
    }

    const categoriaFormatada = novaCategoria.trim();
    
    if (categoriasLocal.includes(categoriaFormatada)) {
      error('Categoria duplicada', 'Esta categoria já existe');
      return;
    }

    setCategoriasLocal(prev => [...prev, categoriaFormatada]);
    setNovaCategoria('');
  };

  const removerCategoria = (index: number) => {
    setCategoriasLocal(prev => prev.filter((_, i) => i !== index));
  };

  const iniciarEdicao = (index: number) => {
    setEditandoIndex(index);
    setValorEdicao(categoriasLocal[index]);
  };

  const salvarEdicao = () => {
    if (!valorEdicao.trim()) {
      error('Categoria vazia', 'Digite o nome da categoria');
      return;
    }

    const categoriaFormatada = valorEdicao.trim();
    
    if (categoriasLocal.includes(categoriaFormatada) && categoriasLocal[editandoIndex!] !== categoriaFormatada) {
      error('Categoria duplicada', 'Esta categoria já existe');
      return;
    }

    setCategoriasLocal(prev => prev.map((cat, i) => i === editandoIndex ? categoriaFormatada : cat));
    setEditandoIndex(null);
    setValorEdicao('');
  };

  const cancelarEdicao = () => {
    setEditandoIndex(null);
    setValorEdicao('');
  };

  const salvarCategorias = async () => {
    setSaving(true);
    
    const sucesso = await updateCategorias(categoriasLocal);
    
    if (sucesso) {
      success(
        'Categorias salvas', 
        `As categorias de ${tipo === 'estoque' ? 'estoque' : 'serviços'} foram atualizadas com sucesso`
      );
      if (onClose) onClose();
    }
    
    setSaving(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: 'add' | 'edit') => {
    if (e.key === 'Enter') {
      if (action === 'add') {
        adicionarCategoria();
      } else {
        salvarEdicao();
      }
    }
  };

  const getExemplos = () => {
    if (tipo === 'estoque') {
      return ['Lubrificantes', 'Filtros', 'Freios', 'Suspensão', 'Motor', 'Elétrica'];
    } else {
      return ['Manutenção Preventiva', 'Diagnóstico', 'Alinhamento', 'Sistema de Freios'];
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Tag className="h-5 w-5 text-red-500" />
          <h3 className="text-lg font-semibold text-white">
            Categorias de {tipo === 'estoque' ? 'Estoque' : 'Serviços'}
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Adicionar nova categoria */}
      <div className="flex space-x-2">
        <div className="flex-1">
          <input
            type="text"
            value={novaCategoria}
            onChange={(e) => setNovaCategoria(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, 'add')}
            className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            placeholder={`Digite o nome da nova categoria de ${tipo === 'estoque' ? 'estoque' : 'serviços'}`}
          />
        </div>
        <Button
          onClick={adicionarCategoria}
          icon={Plus}
          disabled={!novaCategoria.trim()}
        >
          Adicionar
        </Button>
      </div>

      {/* Lista de categorias */}
      <div className="space-y-2 max-h-60 overflow-y-auto">
        {categoriasLocal.map((categoria, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg border border-gray-700"
          >
            {editandoIndex === index ? (
              <div className="flex-1 flex items-center space-x-2">
                <input
                  type="text"
                  value={valorEdicao}
                  onChange={(e) => setValorEdicao(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'edit')}
                  className="flex-1 px-2 py-1 bg-[#2e2e2e] border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                  autoFocus
                />
                <button
                  onClick={salvarEdicao}
                  className="text-green-400 hover:text-green-300 transition-colors"
                >
                  <Save className="h-4 w-4" />
                </button>
                <button
                  onClick={cancelarEdicao}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <Tag className="h-4 w-4 text-gray-400" />
                  <span className="text-white">{categoria}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => iniciarEdicao(index)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => removerCategoria(index)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {categoriasLocal.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Tag className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhuma categoria cadastrada</p>
          <p className="text-sm">
            Adicione categorias para organizar {tipo === 'estoque' ? 'seu estoque' : 'seus serviços'}
          </p>
        </div>
      )}

      {/* Botão salvar */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700">
        {onClose && (
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
        )}
        <Button
          onClick={salvarCategorias}
          icon={Save}
          disabled={saving}
        >
          {saving ? 'Salvando...' : 'Salvar Categorias'}
        </Button>
      </div>

      {/* Informações e exemplos */}
      <div className="p-4 bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded-lg">
        <div className="flex items-start">
          <Tag className="h-5 w-5 text-red-400 mr-3 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-red-400 mb-2">
              Sobre as Categorias de {tipo === 'estoque' ? 'Estoque' : 'Serviços'}
            </h4>
            <ul className="text-sm text-gray-300 space-y-1 mb-3">
              <li>• As categorias organizam {tipo === 'estoque' ? 'itens do estoque' : 'serviços oferecidos'}</li>
              <li>• Você pode adicionar, editar ou remover categorias conforme necessário</li>
              <li>• {tipo === 'estoque' ? 'Itens' : 'Serviços'} existentes manterão suas categorias atuais</li>
              <li>• Categorias removidas ainda aparecerão em {tipo === 'estoque' ? 'itens' : 'serviços'} que as usam</li>
            </ul>
            <div>
              <p className="text-sm font-medium text-red-400 mb-1">Exemplos de categorias:</p>
              <div className="flex flex-wrap gap-2">
                {getExemplos().map((exemplo, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-gray-700 text-gray-300 rounded text-xs"
                  >
                    {exemplo}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoriasManager;