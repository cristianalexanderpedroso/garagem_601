import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Phone, Mail, MapPin, User, Calendar, CreditCard, Loader } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  endereco: string;
  cpf_cnpj: string;
  created_at: string;
  updated_at: string;
}

interface EnderecoViaCEP {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

const Clientes: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
    cpf_cnpj: ''
  });

  const { success, error } = useToast();

  // Buscar clientes do banco
  const fetchClientes = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('clientes')
        .select('*')
        .order('created_at', { ascending: false });

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

  // Buscar endereço por CEP
  const buscarCep = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length !== 8) {
      return;
    }

    setBuscandoCep(true);
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data: EnderecoViaCEP = await response.json();
      
      if (data.erro) {
        error('CEP não encontrado', 'Verifique se o CEP está correto');
        return;
      }

      setFormData(prev => ({
        ...prev,
        logradouro: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        uf: data.uf || ''
      }));

      success('CEP encontrado', 'Endereço preenchido automaticamente');
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
      error('Erro ao buscar CEP', 'Não foi possível consultar o CEP');
    } finally {
      setBuscandoCep(false);
    }
  };

  const filteredClientes = clientes.filter(cliente =>
    cliente.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.telefone.includes(searchTerm) ||
    cliente.cpf_cnpj.includes(searchTerm)
  );

  const handleAddCliente = () => {
    setEditingCliente(null);
    setFormData({
      nome: '',
      email: '',
      telefone: '',
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      uf: '',
      cpf_cnpj: ''
    });
    setShowModal(true);
  };

  const handleEditCliente = (cliente: Cliente) => {
    setEditingCliente(cliente);
    
    // Separar o endereço completo em partes
    const enderecoPartes = cliente.endereco.split(',').map(parte => parte.trim());
    
    setFormData({
      nome: cliente.nome,
      email: cliente.email,
      telefone: cliente.telefone,
      cep: '',
      logradouro: enderecoPartes[0] || '',
      numero: enderecoPartes[1] || '',
      complemento: '',
      bairro: enderecoPartes[2] || '',
      cidade: enderecoPartes[3] || '',
      uf: enderecoPartes[4] || '',
      cpf_cnpj: cliente.cpf_cnpj
    });
    setShowModal(true);
  };

  const handleDeleteCliente = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este cliente? Esta ação também excluirá todos os veículos e orçamentos relacionados.')) return;

    try {
      const { error: deleteError } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      success('Cliente excluído', 'Cliente removido com sucesso');
      await fetchClientes();
    } catch (err) {
      console.error('Erro ao excluir cliente:', err);
      error('Erro ao excluir cliente', 'Não foi possível excluir o cliente');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Montar endereço completo
      const enderecoCompleto = [
        formData.logradouro,
        formData.numero,
        formData.bairro,
        formData.cidade,
        formData.uf
      ].filter(parte => parte.trim() !== '').join(', ');

      const clienteData = {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        endereco: enderecoCompleto,
        cpf_cnpj: formData.cpf_cnpj
      };

      if (editingCliente) {
        const { error: updateError } = await supabase
          .from('clientes')
          .update(clienteData)
          .eq('id', editingCliente.id);

        if (updateError) throw updateError;
        success('Cliente atualizado', 'Dados do cliente atualizados com sucesso');
      } else {
        const { error: insertError } = await supabase
          .from('clientes')
          .insert([clienteData]);

        if (insertError) throw insertError;
        success('Cliente cadastrado', 'Novo cliente adicionado com sucesso');
      }

      setShowModal(false);
      await fetchClientes();
    } catch (err: any) {
      console.error('Erro ao salvar cliente:', err);
      
      // Tratar erros específicos
      if (err.code === '23505') {
        if (err.message.includes('email')) {
          error('Email já cadastrado', 'Este email já está cadastrado para outro cliente');
        } else if (err.message.includes('cpf_cnpj')) {
          error('CPF/CNPJ já cadastrado', 'Este CPF/CNPJ já está cadastrado para outro cliente');
        } else {
          error('Dados duplicados', 'Verifique se email e CPF/CNPJ não estão duplicados');
        }
      } else {
        error('Erro ao salvar cliente', 'Não foi possível salvar os dados do cliente');
      }
    } finally {
      setSaving(false);
    }
  };

  // Formatação de telefone
  const formatTelefone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Aplica formatação baseada no tamanho
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 6) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    } else {
      // Celular com 9 dígitos
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  // Formatação de CEP
  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{1,3})/, '$1-$2');
  };

  // Formatação de CPF/CNPJ
  const formatCpfCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    
    if (numbers.length <= 11) {
      // CPF: 000.000.000-00
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})/, '$1-$2');
    } else {
      // CNPJ: 00.000.000/0000-00
      return numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})/, '$1-$2');
    }
  };

  const handleTelefoneChange = (value: string) => {
    const formatted = formatTelefone(value);
    setFormData(prev => ({ ...prev, telefone: formatted }));
  };

  const handleCepChange = (value: string) => {
    const formatted = formatCep(value);
    setFormData(prev => ({ ...prev, cep: formatted }));
    
    // Buscar automaticamente quando CEP estiver completo
    const cepLimpo = value.replace(/\D/g, '');
    if (cepLimpo.length === 8) {
      buscarCep(cepLimpo);
    }
  };

  const handleCpfCnpjChange = (value: string) => {
    const formatted = formatCpfCnpj(value);
    setFormData(prev => ({ ...prev, cpf_cnpj: formatted }));
  };

  // Validação de email
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validação de CPF/CNPJ
  const isValidCpfCnpj = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.length === 11 || numbers.length === 14;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Clientes</h1>
        <Card>
          <div className="p-12 text-center">
            <div className="text-gray-400">Carregando clientes...</div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Clientes</h1>
        <Button icon={Plus} onClick={handleAddCliente}>
          Novo Cliente
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total de Clientes</p>
                <p className="text-2xl font-bold text-white">{clientes.length}</p>
              </div>
              <div className="p-3 bg-red-500 bg-opacity-20 rounded-full">
                <User className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Novos Este Mês</p>
                <p className="text-2xl font-bold text-white">
                  {clientes.filter(cliente => {
                    const created = new Date(cliente.created_at);
                    const now = new Date();
                    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <div className="p-3 bg-green-500 bg-opacity-20 rounded-full">
                <Calendar className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Pessoas Físicas</p>
                <p className="text-2xl font-bold text-white">
                  {clientes.filter(cliente => cliente.cpf_cnpj.replace(/\D/g, '').length === 11).length}
                </p>
              </div>
              <div className="p-3 bg-yellow-500 bg-opacity-20 rounded-full">
                <User className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Pessoas Jurídicas</p>
                <p className="text-2xl font-bold text-white">
                  {clientes.filter(cliente => cliente.cpf_cnpj.replace(/\D/g, '').length === 14).length}
                </p>
              </div>
              <div className="p-3 bg-purple-500 bg-opacity-20 rounded-full">
                <CreditCard className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Barra de pesquisa */}
      <Card>
        <div className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Pesquisar por nome, email, telefone ou CPF/CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>
      </Card>

      {/* Lista de clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClientes.map((cliente) => (
          <Card key={cliente.id} hover>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">{cliente.nome}</h3>
                  <div className="flex items-center space-x-2 mb-2">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-400">{cliente.cpf_cnpj}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      cliente.cpf_cnpj.replace(/\D/g, '').length === 11 
                        ? 'bg-yellow-500 bg-opacity-20 text-yellow-400' 
                        : 'bg-purple-500 bg-opacity-20 text-purple-400'
                    }`}>
                      {cliente.cpf_cnpj.replace(/\D/g, '').length === 11 ? 'PF' : 'PJ'}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditCliente(cliente)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCliente(cliente.id)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-300">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="truncate">{cliente.email}</span>
                </div>
                <div className="flex items-center text-sm text-gray-300">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  {cliente.telefone}
                </div>
                <div className="flex items-start text-sm text-gray-300">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="break-words">{cliente.endereco}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-400">
                  Cliente desde: {new Date(cliente.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredClientes.length === 0 && (
        <Card>
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Search className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Nenhum cliente encontrado</h3>
            <p className="text-gray-400">
              {searchTerm ? 'Tente ajustar os termos de pesquisa' : 'Comece adicionando um novo cliente'}
            </p>
          </div>
        </Card>
      )}

      {/* Modal de formulário */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Nome Completo *</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Nome completo do cliente"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full px-3 py-2 bg-[#1a1a1a] border rounded-lg text-white focus:outline-none focus:ring-2 ${
                        formData.email && !isValidEmail(formData.email)
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-700 focus:ring-red-500'
                      }`}
                      placeholder="email@exemplo.com"
                      required
                    />
                    {formData.email && !isValidEmail(formData.email) && (
                      <p className="text-red-400 text-xs mt-1">Email inválido</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Telefone *</label>
                    <input
                      type="tel"
                      value={formData.telefone}
                      onChange={(e) => handleTelefoneChange(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="(41) 99999-9999"
                      maxLength={15}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">CPF/CNPJ *</label>
                  <input
                    type="text"
                    value={formData.cpf_cnpj}
                    onChange={(e) => handleCpfCnpjChange(e.target.value)}
                    className={`w-full px-3 py-2 bg-[#1a1a1a] border rounded-lg text-white focus:outline-none focus:ring-2 ${
                      formData.cpf_cnpj && !isValidCpfCnpj(formData.cpf_cnpj)
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-700 focus:ring-red-500'
                    }`}
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    maxLength={18}
                    required
                  />
                  {formData.cpf_cnpj && !isValidCpfCnpj(formData.cpf_cnpj) && (
                    <p className="text-red-400 text-xs mt-1">CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos</p>
                  )}
                </div>

                {/* Seção de Endereço */}
                <div className="border-t border-gray-700 pt-4">
                  <h3 className="text-lg font-medium text-white mb-4">Endereço</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">CEP *</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.cep}
                          onChange={(e) => handleCepChange(e.target.value)}
                          className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                          placeholder="00000-000"
                          maxLength={9}
                          required
                        />
                        {buscandoCep && (
                          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                            <Loader className="h-4 w-4 text-red-500 animate-spin" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Digite o CEP para buscar automaticamente
                      </p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Logradouro *</label>
                      <input
                        type="text"
                        value={formData.logradouro}
                        onChange={(e) => setFormData(prev => ({ ...prev, logradouro: e.target.value }))}
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Rua, Avenida, etc."
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Número *</label>
                      <input
                        type="text"
                        value={formData.numero}
                        onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="123"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Complemento</label>
                      <input
                        type="text"
                        value={formData.complemento}
                        onChange={(e) => setFormData(prev => ({ ...prev, complemento: e.target.value }))}
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Apto, Sala, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Bairro *</label>
                      <input
                        type="text"
                        value={formData.bairro}
                        onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Bairro"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">UF *</label>
                      <input
                        type="text"
                        value={formData.uf}
                        onChange={(e) => setFormData(prev => ({ ...prev, uf: e.target.value.toUpperCase() }))}
                        className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="SP"
                        maxLength={2}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Cidade *</label>
                    <input
                      type="text"
                      value={formData.cidade}
                      onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Cidade"
                      required
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <Button 
                    variant="secondary" 
                    onClick={() => setShowModal(false)}
                    disabled={saving || buscandoCep}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    type="submit"
                    disabled={saving || buscandoCep || !isValidEmail(formData.email) || !isValidCpfCnpj(formData.cpf_cnpj)}
                  >
                    {saving ? 'Salvando...' : (editingCliente ? 'Atualizar' : 'Cadastrar')}
                  </Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Clientes;