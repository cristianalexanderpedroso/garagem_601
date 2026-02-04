import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './useToast';

export const useCategorias = (tipo: 'estoque' | 'servicos' = 'estoque') => {
  const [categorias, setCategorias] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  const chaveConfig = tipo === 'estoque' ? 'categorias_estoque' : 'categorias_servicos';

  const fetchCategorias = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('configuracoes')
        .select('valor')
        .eq('chave', chaveConfig)
        .single();

      if (fetchError) {
        // Se não encontrar a configuração, criar com valores padrão
        if (fetchError.code === 'PGRST116') {
          const valorPadrao = tipo === 'estoque' 
            ? 'Lubrificantes,Filtros,Freios,Suspensão,Motor,Elétrica,Pneus'
            : 'Manutenção Preventiva,Manutenção Corretiva,Diagnóstico,Alinhamento e Balanceamento,Troca de Óleo,Sistema de Freios,Suspensão,Motor,Sistema Elétrico,Ar Condicionado';
          
          await supabase
            .from('configuracoes')
            .insert([{
              chave: chaveConfig,
              valor: valorPadrao,
              tipo: 'string',
              descricao: `Categorias disponíveis para ${tipo === 'estoque' ? 'itens do estoque' : 'serviços'} (separadas por vírgula)`,
              categoria: tipo
            }]);
          
          const categoriasArray = valorPadrao
            .split(',')
            .map(cat => cat.trim())
            .filter(cat => cat.length > 0);
          setCategorias(categoriasArray);
        } else {
          throw fetchError;
        }
      } else if (data?.valor) {
        const categoriasArray = data.valor
          .split(',')
          .map(cat => cat.trim())
          .filter(cat => cat.length > 0);
        setCategorias(categoriasArray);
      }
    } catch (err) {
      console.error('Erro ao carregar categorias:', err);
      error('Erro ao carregar categorias', `Não foi possível carregar as categorias de ${tipo}`);
      // Fallback para categorias padrão
      if (tipo === 'estoque') {
        setCategorias(['Lubrificantes', 'Filtros', 'Freios', 'Suspensão', 'Motor', 'Elétrica', 'Pneus']);
      } else {
        setCategorias(['Manutenção Preventiva', 'Manutenção Corretiva', 'Diagnóstico', 'Alinhamento']);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateCategorias = async (novasCategorias: string[]) => {
    try {
      const valorCategorias = novasCategorias.join(',');
      
      const { error: updateError } = await supabase
        .from('configuracoes')
        .update({ valor: valorCategorias })
        .eq('chave', chaveConfig);

      if (updateError) throw updateError;

      setCategorias(novasCategorias);
      return true;
    } catch (err) {
      console.error('Erro ao atualizar categorias:', err);
      error('Erro ao atualizar categorias', 'Não foi possível salvar as categorias');
      return false;
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, [chaveConfig]);

  return {
    categorias,
    loading,
    updateCategorias,
    refetch: fetchCategorias
  };
};