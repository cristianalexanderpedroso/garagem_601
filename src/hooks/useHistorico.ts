import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './useToast';

interface HistoricoManutencao {
  id: string;
  veiculo_id: string;
  orcamento_id?: string;
  tipo: 'preventiva' | 'corretiva' | 'revisao';
  descricao: string;
  itens_realizados: string[];
  valor_total: number;
  data_realizacao: string;
  proxima_revisao?: string;
  km?: number;
  responsavel: string;
  created_at: string;
  veiculos: {
    placa: string;
    marca: string;
    modelo: string;
    clientes: {
      nome: string;
    };
  };
  orcamentos?: {
    numero_orcamento: string;
  };
}

export const useHistorico = () => {
  const [historico, setHistorico] = useState<HistoricoManutencao[]>([]);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  const fetchHistorico = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('historico_manutencao')
        .select(`
          *,
          veiculos (
            placa,
            marca,
            modelo,
            clientes (nome)
          ),
          orcamentos (numero_orcamento)
        `)
        .order('data_realizacao', { ascending: false });

      if (fetchError) throw fetchError;
      setHistorico(data || []);
    } catch (err) {
      console.error('Erro ao carregar histórico:', err);
      error('Erro ao carregar histórico', 'Não foi possível carregar o histórico de manutenções');
    } finally {
      setLoading(false);
    }
  };

  const salvarHistorico = async (historicoData: Omit<HistoricoManutencao, 'id' | 'created_at' | 'veiculos' | 'orcamentos'>, id?: string) => {
    try {
      if (id) {
        const { error: updateError } = await supabase
          .from('historico_manutencao')
          .update(historicoData)
          .eq('id', id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('historico_manutencao')
          .insert([historicoData]);

        if (insertError) throw insertError;
      }

      await fetchHistorico();
      return true;
    } catch (err) {
      console.error('Erro ao salvar histórico:', err);
      return false;
    }
  };

  const excluirHistorico = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('historico_manutencao')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      await fetchHistorico();
      return true;
    } catch (err) {
      console.error('Erro ao excluir histórico:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchHistorico();
  }, []);

  return {
    historico,
    loading,
    fetchHistorico,
    salvarHistorico,
    excluirHistorico
  };
};