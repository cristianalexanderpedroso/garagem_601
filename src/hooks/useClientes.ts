import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from './useToast';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
}

export const useClientes = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('clientes')
        .select('id, nome, email, telefone')
        .order('nome');

      if (fetchError) throw fetchError;
      setClientes(data || []);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      error('Erro ao carregar clientes', 'Não foi possível carregar a lista de clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientes();
  }, []);

  return {
    clientes,
    loading,
    fetchClientes
  };
};