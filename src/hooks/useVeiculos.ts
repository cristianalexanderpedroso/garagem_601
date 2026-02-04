import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './useToast';

interface Veiculo {
  id: string;
  cliente_id: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  cor: string;
}

export const useVeiculos = () => {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  const fetchVeiculos = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('veiculos')
        .select('id, cliente_id, placa, marca, modelo, ano, cor')
        .order('placa');

      if (fetchError) throw fetchError;
      setVeiculos(data || []);
    } catch (err) {
      console.error('Erro ao carregar veículos:', err);
      error('Erro ao carregar veículos', 'Não foi possível carregar a lista de veículos');
    } finally {
      setLoading(false);
    }
  };

  const getVeiculosByCliente = (clienteId: string) => {
    return veiculos.filter(veiculo => veiculo.cliente_id === clienteId);
  };

  useEffect(() => {
    fetchVeiculos();
  }, []);

  return {
    veiculos,
    loading,
    fetchVeiculos,
    getVeiculosByCliente
  };
};