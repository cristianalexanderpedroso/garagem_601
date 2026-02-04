import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './useToast';

interface Servico {
  id: string;
  nome: string;
  categoria: string;
  preco: number; // Preço de venda
  preco_custo: number; // Preço de custo
  fornecedor: string;
  created_at: string;
  updated_at: string;
}

export const useServicos = () => {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  const fetchServicos = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('estoque')
        .select('*')
        .eq('tipo', 'servico')
        .order('nome');

      if (fetchError) throw fetchError;
      setServicos(data || []);
    } catch (err) {
      console.error('Erro ao carregar serviços:', err);
      error('Erro ao carregar serviços', 'Não foi possível carregar a lista de serviços');
    } finally {
      setLoading(false);
    }
  };

  const salvarServico = async (servicoData: Omit<Servico, 'id' | 'created_at' | 'updated_at'>, id?: string) => {
    try {
      const dataToSend = {
        ...servicoData,
        tipo: 'servico' as const,
        quantidade: 0, // Serviços não têm quantidade física
        quantidade_minima: 0,
        codigo_barras: null
      };

      if (id) {
        const { error: updateError } = await supabase
          .from('estoque')
          .update(dataToSend)
          .eq('id', id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('estoque')
          .insert([dataToSend]);

        if (insertError) throw insertError;
      }

      await fetchServicos();
      return true;
    } catch (err) {
      console.error('Erro ao salvar serviço:', err);
      return false;
    }
  };

  const excluirServico = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('estoque')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      await fetchServicos();
      return true;
    } catch (err) {
      console.error('Erro ao excluir serviço:', err);
      return false;
    }
  };

  useEffect(() => {
    fetchServicos();
  }, []);

  return {
    servicos,
    loading,
    fetchServicos,
    salvarServico,
    excluirServico
  };
};