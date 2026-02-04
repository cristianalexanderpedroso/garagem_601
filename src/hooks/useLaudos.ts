import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './useToast';

interface Laudo {
  id: string;
  orcamento_id?: string;
  cliente_id?: string;
  veiculo_id?: string;
  numero_laudo: string;
  tipo: 'tecnico' | 'vistoria' | 'pericia';
  descricao: string;
  condicao_geral: 'otimo' | 'bom' | 'regular' | 'ruim' | 'pessimo';
  itens_verificados: string[];
  recomendacoes: string[];
  fotos: string[];
  responsavel_tecnico: string;
  created_at: string;
  updated_at: string;
  orcamentos?: {
    numero_orcamento: string;
    cliente_id: string;
    veiculo_id: string;
    clientes: {
      nome: string;
    };
    veiculos: {
      placa: string;
      marca: string;
      modelo: string;
    };
  };
  clientes?: {
    nome: string;
  };
  veiculos?: {
    placa: string;
    marca: string;
    modelo: string;
  };
}

export const useLaudos = () => {
  const [laudos, setLaudos] = useState<Laudo[]>([]);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  const fetchLaudos = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('laudos')
        .select(`
          *,
          orcamentos (
            numero_orcamento,
            cliente_id,
            veiculo_id,
            clientes (nome),
            veiculos (placa, marca, modelo)
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setLaudos(data || []);
    } catch (err) {
      console.error('Erro ao carregar laudos:', err);
      error('Erro ao carregar laudos', 'Não foi possível carregar a lista de laudos');
    } finally {
      setLoading(false);
    }
  };

  const salvarLaudo = async (laudoData: Omit<Laudo, 'id' | 'created_at' | 'updated_at' | 'orcamentos' | 'clientes' | 'veiculos'>, id?: string) => {
    try {
      if (id) {
        const { error: updateError } = await supabase
          .from('laudos')
          .update(laudoData)
          .eq('id', id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('laudos')
          .insert([laudoData]);

        if (insertError) throw insertError;
      }

      await fetchLaudos();
      return true;
    } catch (err) {
      console.error('Erro ao salvar laudo:', err);
      return false;
    }
  };

  const excluirLaudo = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('laudos')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      await fetchLaudos();
      return true;
    } catch (err) {
      console.error('Erro ao excluir laudo:', err);
      return false;
    }
  };

  const gerarNumeroLaudo = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('laudos')
        .select('numero_laudo')
        .order('created_at', { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;

      const ano = new Date().getFullYear();
      let proximoNumero = 1;

      if (data && data.length > 0) {
        const ultimoNumero = data[0].numero_laudo;
        const match = ultimoNumero.match(/LAU-(\d{4})-(\d{3})/);
        if (match && match[1] === ano.toString()) {
          proximoNumero = parseInt(match[2]) + 1;
        }
      }

      return `LAU-${ano}-${new Date().getFullYear()}-${proximoNumero.toString().padStart(3, '0')}`;
    } catch (err) {
      console.error('Erro ao gerar número do laudo:', err);
      return `LAU-${new Date().getFullYear()}-001`;
    }
  };

  useEffect(() => {
    fetchLaudos();
  }, []);

  return {
    laudos,
    loading,
    fetchLaudos,
    salvarLaudo,
    excluirLaudo,
    gerarNumeroLaudo
  };
};