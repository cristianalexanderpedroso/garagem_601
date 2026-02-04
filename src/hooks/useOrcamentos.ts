import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './useToast';

interface Orcamento {
  id: string;
  cliente_id: string;
  veiculo_id: string;
  numero_orcamento: string;
  descricao: string;
  valor_total: number;
  status: string;
  clientes: {
    nome: string;
  };
  veiculos: {
    placa: string;
    marca: string;
    modelo: string;
  };
}

export const useOrcamentos = () => {
  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  const fetchOrcamentos = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('orcamentos')
        .select(`
          id,
          cliente_id,
          veiculo_id,
          numero_orcamento,
          descricao,
          valor_total,
          status,
          clientes (nome),
          veiculos (placa, marca, modelo)
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setOrcamentos(data || []);
    } catch (err) {
      console.error('Erro ao carregar orçamentos:', err);
      error('Erro ao carregar orçamentos', 'Não foi possível carregar a lista de orçamentos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrcamentos();
  }, []);

  return {
    orcamentos,
    loading,
    fetchOrcamentos
  };
};