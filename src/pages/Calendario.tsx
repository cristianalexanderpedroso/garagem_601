import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock,
  User,
  Car,
  Grid3X3,
  List,
  X,
  Save
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, 
         addDays, addWeeks, addMonths, subWeeks, subMonths, isSameDay, isSameMonth,
         parseISO, setHours, setMinutes, isValid, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Card from '../components/Card';
import Button from '../components/Button';
import { ViewMode, CalendarEvent } from '../types';
import { supabase } from '../lib/supabase';
import { useConfiguracoes } from '../hooks/useConfiguracoes';
import { useToast } from '../hooks/useToast';

interface Cliente {
  id: string;
  nome: string;
}

interface Veiculo {
  id: string;
  cliente_id: string;
  placa: string;
  marca: string;
  modelo: string;
}

interface Agendamento {
  id: string;
  cliente_id: string;
  veiculo_id: string;
  orcamento_id?: string;
  titulo: string;
  descricao?: string;
  data_inicio: string;
  data_fim: string;
  status: 'aguardando_inicio' | 'em_analise' | 'aguardando_aprovacao' | 'em_preparacao' | 'aguardando_pecas' | 'no_elevador' | 'em_manutencao' | 'concluido' | 'cancelado';
  responsavel?: string;
  cor: string;
  clientes?: Cliente;
  veiculos?: Veiculo;
}

const STATUS_OPTIONS = [
  { value: 'aguardando_inicio', label: 'Aguardando Início', color: '#6b7280' },
  { value: 'em_analise', label: 'Em Análise', color: '#3b82f6' },
  { value: 'aguardando_aprovacao', label: 'Aguardando Aprovação do Orçamento', color: '#f59e0b' },
  { value: 'em_preparacao', label: 'Em Preparação', color: '#8b5cf6' },
  { value: 'aguardando_pecas', label: 'Aguardando Peças', color: '#f97316' },
  { value: 'no_elevador', label: 'No Elevador', color: '#06b6d4' },
  { value: 'em_manutencao', label: 'Em Manutenção', color: '#dc2626' },
  { value: 'concluido', label: 'Concluído', color: '#10b981' },
  { value: 'cancelado', label: 'Cancelado', color: '#4b5563' }
];

const Calendario: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [veiculos, setVeiculos] = useState<Veiculo[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Agendamento | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { configuracoes } = useConfiguracoes();
  const { success, error } = useToast();

  const [formData, setFormData] = useState({
    cliente_id: '',
    veiculo_id: '',
    titulo: '',
    descricao: '',
    data_inicio: '',
    data_fim: '',
    status: 'aguardando_inicio' as const,
    responsavel: '',
    cor: '#dc2626'
  });

  const horarioInicio = configuracoes.horario_inicio || '08:00';
  const horarioFim = configuracoes.horario_fim || '18:00';

  // Gerar horários de hora em hora
  const generateTimeSlots = () => {
    const slots = [];
    const [startHour] = horarioInicio.split(':').map(Number);
    const [endHour] = horarioFim.split(':').map(Number);
    
    for (let hour = startHour; hour <= endHour; hour++) {
      slots.push(String(hour).padStart(2, '0') + ':00');
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Função para converter string de data em objeto Date válido
  const parseDate = (dateString: string): Date => {
    try {
      // Primeiro, tentar parseISO (formato padrão do Supabase)
      if (dateString.includes('T') || dateString.includes('Z')) {
        const parsed = parseISO(dateString);
        if (isValid(parsed)) return parsed;
      }
      
      // Se não funcionar, tentar new Date
      const parsed = new Date(dateString);
      if (isValid(parsed)) return parsed;
      
      // Se ainda não funcionar, retornar data atual
      console.warn('Data inválida:', dateString);
      return new Date();
    } catch (err) {
      console.error('Erro ao parsear data:', err, dateString);
      return new Date();
    }
  };

  // Buscar dados
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Buscar agendamentos com joins
      const { data: agendamentosData, error: agendamentosError } = await supabase
        .from('agendamentos')
        .select(`
          *,
          clientes(id, nome),
          veiculos(id, cliente_id, placa, marca, modelo)
        `)
        .order('data_inicio', { ascending: true });

      if (agendamentosError) throw agendamentosError;

      // Buscar clientes
      const { data: clientesData, error: clientesError } = await supabase
        .from('clientes')
        .select('id, nome')
        .order('nome');

      if (clientesError) throw clientesError;

      // Buscar veículos com informação do cliente
      const { data: veiculosData, error: veiculosError } = await supabase
        .from('veiculos')
        .select('id, cliente_id, placa, marca, modelo')
        .order('placa');

      if (veiculosError) throw veiculosError;

      console.log('Dados brutos do banco:', agendamentosData); // Debug

      // Converter agendamentos para eventos do calendário
      const calendarEvents: CalendarEvent[] = agendamentosData.map(agendamento => {
        const startDate = parseDate(agendamento.data_inicio);
        const endDate = parseDate(agendamento.data_fim);

        const event = {
          id: agendamento.id,
          title: agendamento.titulo,
          start: startDate,
          end: endDate,
          color: agendamento.cor,
          cliente: agendamento.clientes?.nome || 'Cliente não encontrado',
          veiculo: agendamento.veiculos 
            ? `${agendamento.veiculos.marca} ${agendamento.veiculos.modelo} - ${agendamento.veiculos.placa}` 
            : 'Veículo não encontrado',
          status: agendamento.status
        };

        console.log('Evento convertido:', {
          id: event.id,
          title: event.title,
          start: format(event.start, 'dd/MM/yyyy HH:mm'),
          end: format(event.end, 'dd/MM/yyyy HH:mm'),
          originalStart: agendamento.data_inicio,
          originalEnd: agendamento.data_fim
        }); // Debug

        return event;
      });

      console.log('Total de eventos carregados:', calendarEvents.length); // Debug

      setEvents(calendarEvents);
      setClientes(clientesData || []);
      setVeiculos(veiculosData || []);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
      error('Erro ao carregar dados', 'Não foi possível carregar os dados do calendário');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtrar veículos por cliente selecionado
  const veiculosFiltrados = formData.cliente_id 
    ? veiculos.filter(v => v.cliente_id === formData.cliente_id)
    : veiculos;

  // Navegação
  const navigateDate = (direction: 'prev' | 'next') => {
    if (viewMode === 'month') {
      setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else if (viewMode === 'week') {
      setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    }
  };

  // Obter período atual
  const getCurrentPeriod = () => {
    if (viewMode === 'month') {
      return {
        start: startOfMonth(currentDate),
        end: endOfMonth(currentDate),
        title: format(currentDate, 'MMMM yyyy', { locale: ptBR })
      };
    } else {
      return {
        start: startOfWeek(currentDate, { weekStartsOn: 1 }),
        end: endOfWeek(currentDate, { weekStartsOn: 1 }),
        title: `${format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'dd MMM', { locale: ptBR })} - ${format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'dd MMM yyyy', { locale: ptBR })}`
      };
    }
  };

  const period = getCurrentPeriod();
  const days = eachDayOfInterval({ start: period.start, end: period.end });

  // Função melhorada para comparar datas (apenas dia, mês e ano)
  const isSameDate = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  // Obter eventos para um dia específico - CORRIGIDO
  const getEventsForDay = (date: Date) => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    const dayEvents = events.filter(event => {
      const eventStart = event.start;
      const eventEnd = event.end;
      
      // Verificar se o evento se sobrepõe ao dia
      // Um evento se sobrepõe se:
      // - Começa antes do fim do dia E termina depois do início do dia
      const overlaps = eventStart < dayEnd && eventEnd > dayStart;
      
      return overlaps;
    });
    
    console.log(`Eventos para ${format(date, 'dd/MM/yyyy')}:`, {
      total: dayEvents.length,
      eventos: dayEvents.map(e => ({
        title: e.title,
        start: format(e.start, 'dd/MM/yyyy HH:mm'),
        cliente: e.cliente
      }))
    }); // Debug
    
    return dayEvents;
  };

  // Obter eventos que se sobrepõem a um horário específico
  const getEventsForTimeSlot = (date: Date, timeSlot: string) => {
    const [hour] = timeSlot.split(':').map(Number);
    
    // Criar horários de início e fim do slot
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);
    
    const slotEnd = new Date(date);
    slotEnd.setHours(hour + 1, 0, 0, 0);
    
    const slotEvents = events.filter(event => {
      // Verificar se o evento se sobrepõe ao slot de horário
      const eventStart = event.start;
      const eventEnd = event.end;
      
      // Um evento se sobrepõe se:
      // - Começa antes do fim do slot E termina depois do início do slot
      const overlaps = eventStart < slotEnd && eventEnd > slotStart;
      
      return overlaps;
    });
    
    if (slotEvents.length > 0) {
      console.log(`Eventos no slot ${timeSlot} do dia ${format(date, 'dd/MM/yyyy')}:`, {
        slot: `${format(slotStart, 'HH:mm')} - ${format(slotEnd, 'HH:mm')}`,
        eventos: slotEvents.map(e => ({
          title: e.title,
          start: format(e.start, 'HH:mm'),
          end: format(e.end, 'HH:mm')
        }))
      }); // Debug
    }
    
    return slotEvents;
  };

  // Calcular a posição e altura do evento no slot
  const getEventStyle = (event: CalendarEvent, date: Date, timeSlot: string) => {
    const [hour] = timeSlot.split(':').map(Number);
    
    const slotStart = new Date(date);
    slotStart.setHours(hour, 0, 0, 0);
    
    const slotEnd = new Date(date);
    slotEnd.setHours(hour + 1, 0, 0, 0);
    
    const eventStart = event.start;
    const eventEnd = event.end;
    
    // Calcular início relativo dentro do slot (0-60 minutos)
    const startMinutes = eventStart <= slotStart ? 0 : (eventStart.getTime() - slotStart.getTime()) / (1000 * 60);
    
    // Calcular duração dentro do slot
    const endTime = eventEnd > slotEnd ? slotEnd : eventEnd;
    const duration = (endTime.getTime() - Math.max(eventStart.getTime(), slotStart.getTime())) / (1000 * 60);
    
    return {
      top: `${Math.max(0, (startMinutes / 60) * 100)}%`,
      height: `${Math.max(20, (duration / 60) * 100)}%`, // Altura mínima de 20%
      minHeight: '20px'
    };
  };

  const getStatusColor = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    return statusOption ? statusOption.color : '#dc2626';
  };

  const getStatusLabel = (status: string) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    return statusOption ? statusOption.label : status;
  };

  // Abrir modal para novo agendamento
  const handleNewEvent = (date?: Date) => {
    setEditingEvent(null);
    const selectedDateTime = date || selectedDate || new Date();
    
    // Formatar data para input datetime-local (formato: YYYY-MM-DDTHH:MM)
    const year = selectedDateTime.getFullYear();
    const month = String(selectedDateTime.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDateTime.getDate()).padStart(2, '0');
    
    const startTime = `${year}-${month}-${day}T09:00`;
    const endTime = `${year}-${month}-${day}T10:00`;
    
    setFormData({
      cliente_id: '',
      veiculo_id: '',
      titulo: '',
      descricao: '',
      data_inicio: startTime,
      data_fim: endTime,
      status: 'aguardando_inicio',
      responsavel: '',
      cor: '#dc2626'
    });
    setShowEventModal(true);
  };

  // Editar evento existente
  const handleEditEvent = async (eventId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('agendamentos')
        .select('*')
        .eq('id', eventId)
        .single();

      if (fetchError) throw fetchError;

      setEditingEvent(data);
      
      // Converter datas para formato do input datetime-local
      const startDate = parseDate(data.data_inicio);
      const endDate = parseDate(data.data_fim);
      
      // Formato: YYYY-MM-DDTHH:MM
      const formatForInput = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };
      
      setFormData({
        cliente_id: data.cliente_id,
        veiculo_id: data.veiculo_id,
        titulo: data.titulo,
        descricao: data.descricao || '',
        data_inicio: formatForInput(startDate),
        data_fim: formatForInput(endDate),
        status: data.status,
        responsavel: data.responsavel || '',
        cor: data.cor
      });
      setShowEventModal(true);
    } catch (err) {
      console.error('Erro ao carregar agendamento:', err);
      error('Erro ao carregar agendamento', 'Não foi possível carregar os dados do agendamento');
    }
  };

  // Salvar agendamento
  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Converter datas para ISO string com timezone local
      const dataInicio = new Date(formData.data_inicio);
      const dataFim = new Date(formData.data_fim);

      // Validar datas
      if (!isValid(dataInicio) || !isValid(dataFim)) {
        throw new Error('Datas inválidas');
      }

      if (dataFim <= dataInicio) {
        throw new Error('A data de fim deve ser posterior à data de início');
      }

      const agendamentoData = {
        cliente_id: formData.cliente_id,
        veiculo_id: formData.veiculo_id,
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        data_inicio: dataInicio.toISOString(),
        data_fim: dataFim.toISOString(),
        status: formData.status,
        responsavel: formData.responsavel || null,
        cor: formData.cor
      };

      console.log('Salvando agendamento:', {
        ...agendamentoData,
        data_inicio_formatted: format(dataInicio, 'dd/MM/yyyy HH:mm'),
        data_fim_formatted: format(dataFim, 'dd/MM/yyyy HH:mm')
      }); // Debug

      if (editingEvent) {
        const { error: updateError } = await supabase
          .from('agendamentos')
          .update(agendamentoData)
          .eq('id', editingEvent.id);

        if (updateError) throw updateError;
        success('Agendamento atualizado', 'Agendamento atualizado com sucesso');
      } else {
        const { error: insertError } = await supabase
          .from('agendamentos')
          .insert([agendamentoData]);

        if (insertError) throw insertError;
        success('Agendamento criado', 'Novo agendamento criado com sucesso');
      }

      setShowEventModal(false);
      await fetchData(); // Recarregar dados
    } catch (err: any) {
      console.error('Erro ao salvar agendamento:', err);
      error('Erro ao salvar agendamento', err.message || 'Não foi possível salvar o agendamento');
    } finally {
      setSaving(false);
    }
  };

  // Excluir agendamento
  const handleDeleteEvent = async () => {
    if (!editingEvent || !confirm('Tem certeza que deseja excluir este agendamento?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('agendamentos')
        .delete()
        .eq('id', editingEvent.id);

      if (deleteError) throw deleteError;

      success('Agendamento excluído', 'Agendamento removido com sucesso');
      setShowEventModal(false);
      await fetchData();
    } catch (err) {
      console.error('Erro ao excluir agendamento:', err);
      error('Erro ao excluir agendamento', 'Não foi possível excluir o agendamento');
    }
  };

  // Renderizar visualização mensal
  const renderMonthView = () => {
    const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Cabeçalho dos dias da semana */}
        {weekDays.map(day => (
          <div key={day} className="p-3 text-center font-medium text-gray-400 bg-[#1a1a1a] rounded-lg">
            {day}
          </div>
        ))}
        
        {/* Dias do mês */}
        {days.map(day => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          
          return (
            <div
              key={day.toISOString()}
              className={`min-h-[120px] p-2 border border-gray-700 rounded-lg cursor-pointer transition-colors ${
                isCurrentMonth ? 'bg-[#2e2e2e] hover:bg-[#3a3a3a]' : 'bg-[#1a1a1a] text-gray-500'
              } ${isToday ? 'ring-2 ring-red-500' : ''}`}
              onClick={() => handleNewEvent(day)}
            >
              <div className={`text-sm font-medium mb-1 ${isToday ? 'text-red-400' : 'text-white'}`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className={`text-xs p-1 rounded text-white truncate cursor-pointer border border-white border-opacity-20`}
                    style={{ backgroundColor: getStatusColor(event.status) }}
                    title={`${event.title} - ${event.cliente}\n${format(event.start, 'HH:mm')} - ${format(event.end, 'HH:mm')}\nStatus: ${getStatusLabel(event.status)}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditEvent(event.id);
                    }}
                  >
                    {format(event.start, 'HH:mm')} {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-400">
                    +{dayEvents.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Renderizar visualização semanal
  const renderWeekView = () => {
    const weekDays = days.slice(0, 7); // Apenas 7 dias para a semana
    
    return (
      <div className="flex flex-col">
        {/* Cabeçalho dos dias */}
        <div className="grid grid-cols-8 gap-1 mb-2">
          <div className="p-3 text-center font-medium text-gray-400"></div>
          {weekDays.map(day => {
            const isToday = isSameDay(day, new Date());
            const dayEvents = getEventsForDay(day);
            return (
              <div
                key={day.toISOString()}
                className={`p-3 text-center font-medium rounded-lg cursor-pointer ${
                  isToday ? 'bg-red-500 text-white' : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#3a3a3a]'
                }`}
                onClick={() => handleNewEvent(day)}
              >
                <div className="text-xs">{format(day, 'EEE', { locale: ptBR })}</div>
                <div className="text-lg">{format(day, 'd')}</div>
                {dayEvents.length > 0 && (
                  <div className="text-xs mt-1 px-1 bg-red-600 rounded">
                    {dayEvents.length}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Grade de horários */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-8 gap-1">
            {/* Coluna de horários */}
            <div className="space-y-1">
              {timeSlots.map(timeSlot => (
                <div
                  key={timeSlot}
                  className="h-20 flex items-center justify-center text-sm text-gray-400 bg-[#1a1a1a] rounded"
                >
                  {timeSlot}
                </div>
              ))}
            </div>

            {/* Colunas dos dias */}
            {weekDays.map(day => (
              <div key={day.toISOString()} className="space-y-1">
                {timeSlots.map(timeSlot => {
                  const slotEvents = getEventsForTimeSlot(day, timeSlot);
                  
                  return (
                    <div
                      key={`${day.toISOString()}-${timeSlot}`}
                      className="h-20 border border-gray-700 rounded cursor-pointer hover:bg-[#3a3a3a] transition-colors relative"
                      onClick={() => {
                        const [hour] = timeSlot.split(':').map(Number);
                        const dateTime = new Date(day);
                        dateTime.setHours(hour, 0, 0, 0);
                        handleNewEvent(dateTime);
                      }}
                    >
                      {slotEvents.map(event => {
                        const style = getEventStyle(event, day, timeSlot);
                        return (
                          <div
                            key={event.id}
                            className={`absolute left-1 right-1 p-1 rounded text-xs text-white truncate cursor-pointer z-10 border border-white border-opacity-30 shadow-sm`}
                            style={{ 
                              ...style, 
                              backgroundColor: getStatusColor(event.status)
                            }}
                            title={`${event.title} - ${event.cliente}\n${format(event.start, 'HH:mm')} - ${format(event.end, 'HH:mm')}\nStatus: ${getStatusLabel(event.status)}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditEvent(event.id);
                            }}
                          >
                            <div className="font-medium truncate">{event.title}</div>
                            <div className="text-xs opacity-75 truncate">{event.cliente}</div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Calendário de Agendamentos</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-[#1a1a1a] rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                viewMode === 'month' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                viewMode === 'week' ? 'bg-red-500 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <Button icon={Plus} onClick={() => handleNewEvent()}>
            Novo Agendamento
          </Button>
        </div>
      </div>

      {/* Controles de navegação */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-xl font-semibold text-white capitalize">
                {period.title}
              </h2>
              <button
                onClick={() => navigateDate('next')}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 bg-[#1a1a1a] text-gray-300 rounded-lg hover:bg-[#3a3a3a] transition-colors"
              >
                Hoje
              </button>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Clock className="h-4 w-4" />
                <span>{horarioInicio} - {horarioFim}</span>
              </div>
              <div className="text-sm text-gray-400">
                {events.length} agendamento{events.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Legenda de status */}
      <Card>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {STATUS_OPTIONS.map(status => (
              <div key={status.value} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded" 
                  style={{ backgroundColor: status.color }}
                ></div>
                <span className="text-sm text-gray-300 truncate" title={status.label}>
                  {status.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Calendário */}
      <Card>
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-400">Carregando agendamentos...</div>
            </div>
          ) : (
            <>
              {viewMode === 'month' && renderMonthView()}
              {viewMode === 'week' && renderWeekView()}
            </>
          )}
        </div>
      </Card>

      {/* Modal de agendamento */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                  {editingEvent ? 'Editar Agendamento' : 'Novo Agendamento'}
                </h2>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Título *</label>
                  <input
                    type="text"
                    value={formData.titulo}
                    onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Título do agendamento"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Cliente *</label>
                    <select
                      value={formData.cliente_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, cliente_id: e.target.value, veiculo_id: '' }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    >
                      <option value="">Selecione um cliente</option>
                      {clientes.map(cliente => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Veículo *</label>
                    <select
                      value={formData.veiculo_id}
                      onChange={(e) => setFormData(prev => ({ ...prev, veiculo_id: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                      disabled={!formData.cliente_id}
                    >
                      <option value="">Selecione um veículo</option>
                      {veiculosFiltrados.map(veiculo => (
                        <option key={veiculo.id} value={veiculo.id}>
                          {veiculo.marca} {veiculo.modelo} - {veiculo.placa}
                        </option>
                      ))}
                    </select>
                    {formData.cliente_id && veiculosFiltrados.length === 0 && (
                      <p className="text-xs text-yellow-400 mt-1">
                        Este cliente não possui veículos cadastrados
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    required
                  >
                    {STATUS_OPTIONS.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Descrição</label>
                  <textarea
                    value={formData.descricao}
                    onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                    className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Descrição do serviço"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Data/Hora Início *</label>
                    <input
                      type="datetime-local"
                      value={formData.data_inicio}
                      onChange={(e) => setFormData(prev => ({ ...prev, data_inicio: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Data/Hora Fim *</label>
                    <input
                      type="datetime-local"
                      value={formData.data_fim}
                      onChange={(e) => setFormData(prev => ({ ...prev, data_fim: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Responsável</label>
                    <input
                      type="text"
                      value={formData.responsavel}
                      onChange={(e) => setFormData(prev => ({ ...prev, responsavel: e.target.value }))}
                      className="w-full px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="Nome do responsável"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Cor</label>
                    <input
                      type="color"
                      value={formData.cor}
                      onChange={(e) => setFormData(prev => ({ ...prev, cor: e.target.value }))}
                      className="w-full h-10 px-3 py-2 bg-[#1a1a1a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <div>
                    {editingEvent && (
                      <Button
                        type="button"
                        variant="danger"
                        onClick={handleDeleteEvent}
                        disabled={saving}
                      >
                        Excluir
                      </Button>
                    )}
                  </div>
                  <div className="flex space-x-3">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setShowEventModal(false)}
                      disabled={saving}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      icon={Save}
                      disabled={saving}
                    >
                      {saving ? 'Salvando...' : (editingEvent ? 'Atualizar' : 'Criar')}
                    </Button>
                  </div>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Calendario;