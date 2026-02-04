import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Car, User, Calendar, Wrench, Upload, X, Image } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { supabase } from '../lib/supabase';
import { useToast } from '../hooks/useToast';

interface Cliente {
  id: string;
  nome: string;
  email: string;
  telefone: string;
}

interface Veiculo {
  id: string;
  cliente_id: string;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  cor: string;
  chassi?: string;
  km_entrada?: number;
  imagem_url?: string;
  created_at: string;
  clientes?: Cliente;
}

const Veiculos: React.FC = () => {
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVeiculo, setEditingVeiculo] = useState<Veiculo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    cliente_id: '',
    placa: '',
    marca: '',
    modelo: '',
    ano: new Date().getFullYear(),
    cor: '',
    chassi: '',
    km_entrada: 0,
    imagem_url: ''
  });

  const { success, error } = useToast();

  // Buscar veículos
  const fetchVeiculos = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('veiculos')
        .select(`
          *,
          clientes (
            id,
            nome,
            email,
            telefone
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;
      setVeiculos(data || []);
    } catch (err) {
      console.error('Erro ao carregar veículos:', err);
      error('Erro ao carregar veículos', 'Não foi possível carregar a lista de veículos');
    } finally {
      setLoading(false);
    }
  };

  // Buscar clientes
  const fetchClientes = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('clientes')
        .select('id, nome, email, telefone')
        .order('nome');

      if (fetchError) throw fetchError;
      setClientes(data || []);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      error('Erro ao carregar clientes', 'Não foi possível carregar a lista de clientes');
    }
  };

  useEffect(() => {
    fetchVeiculos();
    fetchClientes();
  }, []);

  const filteredVeiculos = veiculos.filter(veiculo =>
    veiculo.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    veiculo.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    veiculo.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    veiculo.clientes?.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddVeiculo = () => {
    setEditingVeiculo(null);
    setFormData({
      cliente_id: '',
      placa: '',
      marca: '',
      modelo: '',
      ano: new Date().getFullYear(),
      cor: '',
      chassi: '',
      km_entrada: 0,
      imagem_url: ''
    });
    setShowModal(true);
  };

  const handleEditVeiculo = (veiculo: Veiculo) => {
    setEditingVeiculo(veiculo);
    setFormData({
      cliente_id: veiculo.cliente_id,
      placa: veiculo.placa,
      marca: veiculo.marca,
      modelo: veiculo.modelo,
      ano: veiculo.ano,
      cor: veiculo.cor,
      chassi: veiculo.chassi || '',
      km_entrada: veiculo.km_entrada || 0,
      imagem_url: veiculo.imagem_url || ''
    });
    setShowModal(true);
  };

  const handleDeleteVeiculo = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este veículo?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('veiculos')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      success('Veículo excluído', 'Veículo removido com sucesso');
      await fetchVeiculos();
    } catch (err) {
      console.error('Erro ao excluir veículo:', err);
      error('Erro ao excluir veículo', 'Não foi possível excluir o veículo');
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      error('Arquivo inválido', 'Por favor, selecione apenas arquivos de imagem');
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      error('Arquivo muito grande', 'A imagem deve ter no máximo 5MB');
      return;
    }

    setUploadingImage(true);

    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `veiculos/${fileName}`;

      // Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, imagem_url: data.publicUrl }));
      success('Imagem carregada', 'Imagem do veículo carregada com sucesso');
    } catch (err) {
      console.error('Erro ao fazer upload da imagem:', err);
      error('Erro no upload', 'Não foi possível carregar a imagem');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Preparar dados para envio (remover campos vazios opcionais)
      const dataToSend = {
        ...formData,
        chassi: formData.chassi.trim() || null, // Permitir null se vazio
        km_entrada: formData.km_entrada || null,
        imagem_url: formData.imagem_url || null
      };

      if (editingVeiculo) {
        const { error: updateError } = await supabase
          .from('veiculos')
          .update(dataToSend)
          .eq('id', editingVeiculo.id);

        if (updateError) throw updateError;
        success('Veículo atualizado', 'Dados do veículo atualizados com sucesso');
      } else {
        const { error: insertError } = await supabase
          .from('veiculos')
          .insert([dataToSend]);

        if (insertError) throw insertError;
        success('Veículo cadastrado', 'Novo veículo adicionado com sucesso');
      }

      setShowModal(false);
      await fetchVeiculos();
    } catch (err: any) {
      console.error('Erro ao salvar veículo:', err);
      
      if (err.code === '23505') {
        if (err.message.includes('placa')) {
          error('Placa já cadastrada', 'Esta placa já está cadastrada para outro veículo');
        } else if (err.message.includes('chassi')) {
          error('Chassi já cadastrado', 'Este chassi já está cadastrado para outro veículo');
        } else {
          error('Dados duplicados', 'Verifique se placa e chassi não estão duplicados');
        }
      } else {
        error('Erro ao salvar veículo', 'Não foi possível salvar os dados do veículo');
      }
    } finally {
      setSaving(false);
    }
  };

  const formatPlaca = (placa: string) => {
    // Remove caracteres não alfanuméricos
    const cleaned = placa.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    
    // Aplica formato AAA-0000 ou AAA0A00 (Mercosul)
    if (cleaned.length <= 3) {
      return cleaned;
    } else if (cleaned.length <= 7) {
      return cleaned.slice(0, 3) + '-' + cleaned.slice(3);
    }
    
    return cleaned.slice(0, 3) + '-' + cleaned.slice(3, 7);
  };

  const handlePlacaChange = (value: string) => {
    const formatted = formatPlaca(value);
    setFormData(prev => ({ ...prev, placa: formatted }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Veículos</h1>
        <Card>
          <div className="p-12 text-center">
            <div className="text-gray-400">Carregando veículos...</div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Veículos</h1>
        <Button icon={Plus} onClick={handleAddVeiculo}>
          Novo Veículo
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total de Veículos</p>
                <p className="text-2xl font-bold text-white">{veiculos.length}</p>
              </div>
              <div className="p-3 bg-red-500 bg-opacity-20 rounded-full">
                <Car className="h-6 w-6 text-red-500" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Clientes Ativos</p>
                <p className="text-2xl font-bold text-white">{clientes.length}</p>
              </div>
              <div className="p-3 bg-green-500 bg-opacity-20 rounded-full">
                <User className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Veículos Este Mês</p>
                <p className="text-2xl font-bold text-white">
                  {veiculos.filter(v => {
                    const created = new Date(v.created_at);
                    const now = new Date();
                    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
              <div className="p-3 bg-yellow-500 bg-opacity-20 rounded-full">
                <Calendar className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Marcas Diferentes</p>
                <p className="text-2xl font-bold text-white">
                  {new Set(veiculos.map(v => v.marca)).size}
                </p>
              </div>
              <div className="p-3 bg-purple-500 bg-opacity-20 rounded-full">
                <Wrench className="h-6 w-6 text-purple-500" />
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
              placeholder="Pesquisar por placa, marca, modelo ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
        </div>
      </Card>

      {/* Lista de veículos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVeiculos.map((veiculo) => (
          <Card key={veiculo.id} hover>
            <div className="p-6">
              {/* Imagem do veículo */}
              {veiculo.imagem_url && (
                <div className="mb-4 rounded-lg overflow-hidden">
                  <img
                    src={veiculo.imagem_url}
                    alt={`${veiculo.marca} ${veiculo.modelo}`}
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      // Esconder imagem se não carregar
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Car className="h-5 w-5 text-red-500" />
                    <h3 className="text-lg font-semibold text-white">{veiculo.placa}</h3>
                  </div>
                  <p className="text-xl font-medium text-gray-300 mb-1">
                    {veiculo.marca} {veiculo.modelo}
                  </p>
                  <p className="text-sm text-gray-400">{veiculo.ano} • {veiculo.cor}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditVeiculo(veiculo)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteVeiculo(veiculo.id)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-300">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  <span className="font-medium">Cliente:</span>
                  <span className="ml-2">{veiculo.clientes?.nome}</span>
                </div>
                
                {veiculo.chassi && (
                  <div className="flex items-center text-sm text-gray-300">
                    <span className="font-medium">Chassi:</span>
                    <span className="ml-2 font-mono text-xs">{veiculo.chassi}</span>
                  </div>
                )}

                {veiculo.km_entrada && (
                  <div className="flex items-center text-sm text-gray-300">
                    <span className="font-medium">KM Entrada:</span>
                    <span className="ml-2">{veiculo.km_entrada?.toLocaleString('pt-BR')} km</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-400">
                  Cadastrado em: {new Date(veiculo.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredVeiculos.length === 0 && (
        <Card>
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Car className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Nenhum veículo encontrado</h3>
            <p className="text-gray-400">
              {searchTerm ? 'Tente ajustar os termos de pesquisa' : 'Comece adicionando um novo veículo'}
            </p>
          </div>
        </Card>
      )}

      {/* Modal de formulário */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                {editingVeiculo ? 'Editar Veículo' : 'Novo Veículo'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Cliente *</label>
                  <select
                    value={formData.cliente_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, cliente_id: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  >
                    <option value="">Selecione um cliente</option>
                    {clientes.map(cliente => (
                      <option key={cliente.id} value={cliente.id}>
                        {cliente.nome} - {cliente.email}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Campo de imagem */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Imagem do Veículo</label>
                  <div className="space-y-3">
                    {formData.imagem_url && (
                      <div className="relative">
                        <img
                          src={formData.imagem_url}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, imagem_url: '' }))}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-700 border-dashed rounded-lg cursor-pointer bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {uploadingImage ? (
                            <div className="text-gray-400">Carregando...</div>
                          ) : (
                            <>
                              <Upload className="w-8 h-8 mb-2 text-gray-400" />
                              <p className="mb-2 text-sm text-gray-400">
                                <span className="font-semibold">Clique para enviar</span> ou arraste a imagem
                              </p>
                              <p className="text-xs text-gray-400">PNG, JPG ou JPEG (máx. 5MB)</p>
                            </>
                          )}
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageUpload(file);
                          }}
                          disabled={uploadingImage}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Placa *</label>
                    <input
                      type="text"
                      value={formData.placa}
                      onChange={(e) => handlePlacaChange(e.target.value)}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="AAA-0000"
                      maxLength={8}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Marca *</label>
                    <input
                      type="text"
                      value={formData.marca}
                      onChange={(e) => setFormData(prev => ({ ...prev, marca: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Ex: Honda, Toyota, Ford"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Modelo *</label>
                    <input
                      type="text"
                      value={formData.modelo}
                      onChange={(e) => setFormData(prev => ({ ...prev, modelo: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Ex: Civic, Corolla, Focus"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Ano *</label>
                    <input
                      type="number"
                      value={formData.ano}
                      onChange={(e) => setFormData(prev => ({ ...prev, ano: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      min="1900"
                      max={new Date().getFullYear() + 1}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Cor *</label>
                    <input
                      type="text"
                      value={formData.cor}
                      onChange={(e) => setFormData(prev => ({ ...prev, cor: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Ex: Branco, Prata, Preto"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">KM de Entrada</label>
                    <input
                      type="number"
                      value={formData.km_entrada}
                      onChange={(e) => setFormData(prev => ({ ...prev, km_entrada: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Quilometragem atual"
                      min="0"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Chassi <span className="text-gray-500">(opcional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.chassi}
                    onChange={(e) => setFormData(prev => ({ ...prev, chassi: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Número do chassi (17 dígitos) - opcional"
                    maxLength={17}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    O chassi é opcional e pode ser preenchido posteriormente
                  </p>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <Button variant="secondary" onClick={() => setShowModal(false)} disabled={saving}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving || uploadingImage}>
                    {saving ? 'Salvando...' : (editingVeiculo ? 'Atualizar' : 'Cadastrar')}
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

export default Veiculos;