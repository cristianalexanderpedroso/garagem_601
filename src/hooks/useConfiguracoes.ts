import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Configuracao } from '../types';

export const useConfiguracoes = () => {
  const [configuracoes, setConfiguracoes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfiguracoes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('configuracoes')
        .select('*');

      if (error) throw error;

      const configMap = data.reduce((acc, config) => {
        acc[config.chave] = config.valor;
        return acc;
      }, {} as Record<string, string>);

      setConfiguracoes(configMap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const updateConfiguracao = async (chave: string, valor: string) => {
    try {
      const { error } = await supabase
        .from('configuracoes')
        .update({ valor })
        .eq('chave', chave);

      if (error) throw error;

      setConfiguracoes(prev => ({ ...prev, [chave]: valor }));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar configuração');
      return false;
    }
  };

  useEffect(() => {
    fetchConfiguracoes();
  }, []);

  return {
    configuracoes,
    loading,
    error,
    updateConfiguracao,
    refetch: fetchConfiguracoes
  };
};