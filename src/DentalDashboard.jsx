// src/DentalDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  RefreshCw, Bot, Search, Plus, Edit2, Trash2, X, Phone,
  FileText, Ban, Calendar, Clock, LogOut, Users, Stethoscope // <--- NUEVO IMPORT
} from 'lucide-react';

import DoctorsPanel from './DoctorsPanel';

// --- CONFIGURACIÓN ---
const CONFIG = {
  USE_MOCK_DATA: false, 
  API_BASE_URL: 'https://agente-de-citas-dental-space-n8n.ofcrls.easypanel.host/webhook', 
  ENDPOINTS: { 
    GET: '/get-appointments', 
    TOGGLE_BOT: '/toggle-bot', 
    CRUD: '/dashboard-action' 
  }
};

// --- GENERADOR DE HORARIOS ---
const generateTimeSlots = () => {
  const slots = [];
  for (let i = 8; i < 19; i++) {
    const hour = i > 12 ? i - 12 : i;
    const ampm = i >= 12 ? 'PM' : 'AM';
    slots.push({ value: `${i.toString().padStart(2, '0')}:00`, label: `${hour}:00 ${ampm}` });
    slots.push({ value: `${i.toString().padStart(2, '0')}:30`, label: `${hour}:30 ${ampm}` });
  }
  return slots;
};
const TIME_SLOTS = generateTimeSlots();

// --- UTILIDADES DE FECHA ---
const DateUtils = {
  formatDate: (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-DO', { weekday: 'short', day: 'numeric', month: 'short' }).format(date);
  },
  formatTime: (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-DO', { hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
  }
};

// --- BADGE DE ESTADO ---
const StatusBadge = ({ status }) => {
  const styles = 
    status === 'Agendada' ? 'bg-teal-50 text-teal-700 ring-1 ring-teal-600/20' : 
    status === 'Reprogramada' ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20' : 
    status === 'Cancelada' ? 'bg-rose-50 text-rose-700 ring-1 ring-rose-600/20' : 
    'bg-slate-100 text-slate-600 ring-1 ring-slate-600/20';

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${styles}`}>
      {status || 'Pendiente'}
    </span>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function DentalSpaceDashboard({ onLogout }) {
  
  // --- ESTADOS ---
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [botActive, setBotActive] = useState(true); 
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); 
  
  // Estado para modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDoctorsOpen, setIsDoctorsOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null); 
  
  // ESTADO DEL FORMULARIO (Incluye 'doctor')
  const [formData, setFormData] = useState({ 
    title: '', 
    phone: '', 
    service: '', 
    start: '', 
    status: 'Agendada', 
    source: 'manual',
    doctor: '' // <--- NUEVO CAMPO
  });

  // --- API: CARGAR DATOS ---
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.GET}`);
      if (!response.ok) throw new Error('Error al cargar datos');
      const jsonResponse = await response.json();
      const rawData = jsonResponse.data || [];
      const cleanData = rawData.map(apt => ({ ...apt, start: new Date(apt.start), end: new Date(apt.end) }));
      cleanData.sort((a, b) => b.start - a.start);
      setAppointments(cleanData);
      if (typeof jsonResponse.botActive !== 'undefined') setBotActive(jsonResponse.botActive);
    } catch (error) { console.error("Error fetching:", error); } finally { setLoading(false); }
  }, []);

  // --- API: CONTROL DEL BOT ---
  const toggleBot = async () => {
    const newState = !botActive;
    setBotActive(newState); 
    try {
      await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.TOGGLE_BOT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newState })
      });
    } catch (error) {
      console.error("Error toggling bot:", error);
      setBotActive(!newState); 
      alert("Error de conexión al cambiar estado del bot.");
    }
  };

  useEffect(() => {
    fetchAppointments();
    const interval = setInterval(fetchAppointments, 10000); 
    return () => clearInterval(interval);
  }, [fetchAppointments]);

  // --- ABRIR MODAL (Formulario) ---
  const handleOpenModal = (appointment = null) => {
    if (appointment) {
      setEditingAppointment(appointment);
      const d = new Date(appointment.start);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setFormData({
        title: appointment.title,
        phone: appointment.resource?.phone || '',
        service: appointment.resource?.service || '',
        start: d.toISOString().slice(0, 16),
        status: appointment.resource?.status || 'Agendada',
        source: appointment.resource?.source || 'manual',
        doctor: appointment.resource?.doctor || '' // <--- CARGAR DOCTOR AL EDITAR
      });
    } else {
      setEditingAppointment(null);
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setFormData({ 
        title: '', phone: '', service: '', 
        start: `${now.toISOString().split('T')[0]}T09:00`, 
        status: 'Agendada', source: 'manual',
        doctor: '' // <--- DOCTOR VACÍO AL CREAR
      });
    }
    setIsModalOpen(true);
  };

  // --- API: GUARDAR (Crear/Editar) ---
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    const startDate = new Date(formData.start);
    const endDate = new Date(startDate.getTime() + 30 * 60000); 
    const actionType = editingAppointment ? 'update' : 'create';
    
    // Payload con el campo doctor incluido
    const networkPayload = {
        action: actionType,
        data: { 
            title: formData.title, 
            phone: formData.phone, 
            service: formData.service, 
            status: formData.status, 
            start: startDate.toISOString(), 
            end: endDate.toISOString(), 
            id: editingAppointment?.id, 
            eventId: editingAppointment?.resource?.eventId,
            doctor: formData.doctor // <--- ENVIAR DOCTOR A LA API
        }
    };

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.CRUD}`, { 
            method: 'POST', headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify(networkPayload) 
        });
        if (!response.ok) throw new Error('Error servidor');
        await fetchAppointments(); 
        setIsModalOpen(false);
    } catch (error) { console.error("Error saving:", error); alert("Error al guardar."); } finally { setLoading(false); }
  };

  // --- API: CANCELAR/BORRAR ---
  const handleCancel = async (id) => {
    const apt = appointments.find(a => a.id === id);
    if (!apt || !window.confirm('¿CANCELAR esta cita? Se eliminará de Google Calendar.')) return;
    setLoading(true);
    try {
        await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.CRUD}`, { 
            method: 'POST', headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ action: 'delete', data: { id: id, eventId: apt.resource?.eventId } }) 
        });
        await fetchAppointments();
    } catch (error) { console.error("Error canceling:", error); alert("No se pudo cancelar."); } finally { setLoading(false); }
  };

  const handleHardDelete = async (id) => {
    if (!window.confirm('⚠️ ¿Borrar DEFINITIVAMENTE? No se puede deshacer.')) return;
    setLoading(true);
    try {
        await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.CRUD}`, { 
            method: 'POST', headers: { 'Content-Type': 'application/json' }, 
            body: JSON.stringify({ action: 'hard_delete', data: { id: id } }) 
        });
        await fetchAppointments();
    } catch (error) { console.error("Error hard deleting:", error); alert("No se pudo eliminar."); } finally { setLoading(false); }
  };

  // --- FILTROS ---
  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.title.toLowerCase().includes(searchTerm.toLowerCase()) || (apt.resource?.phone || '').includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || apt.resource?.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // --- RENDERIZADO ---
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-900 pb-20 md:pb-0">
      
      {/* HEADER: Efecto cristal + Logo Circular */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-4 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/logo-dental.png" 
                alt="Dental Space Logo" 
                className="w-10 h-10 md:w-11 md:h-11 object-contain drop-shadow-sm rounded-full bg-white" 
              />
              
              <div>
                  <h1 className="text-lg md:text-xl font-bold text-slate-800 leading-tight">Panel Admin</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-3">
                <button onClick={fetchAppointments} className="p-2.5 bg-slate-100/50 hover:bg-brand-50 text-slate-500 hover:text-brand-600 rounded-xl transition-all md:tooltip" title="Actualizar">
                    <RefreshCw size={18} className={loading ? "animate-spin text-brand-600" : ""} />
                </button>
                
                {/* --- BOTÓN EQUIPO --- */}
                <button 
                    onClick={() => setIsDoctorsOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-all shadow-sm text-[10px] md:text-xs font-bold uppercase tracking-wider"
                    title="Gestionar Doctores"
                >
                    <Users size={16} />
                    <span className="hidden md:inline">Equipo</span>
                </button>

                {/* --- BOTÓN IA --- */}
                <button 
                    onClick={toggleBot}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all shadow-sm
                    ${botActive ? 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100' : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'}`}
                >
                    <div className={`w-2 h-2 rounded-full relative ${botActive ? 'bg-teal-500' : 'bg-rose-500'}`}>
                       {botActive && <div className="absolute inset-0 bg-teal-400 rounded-full animate-ping opacity-75"></div>}
                    </div>
                    <span className="hidden md:inline">{botActive ? 'IA Activa' : 'IA Pausada'}</span>
                    <span className="md:hidden">{botActive ? 'ON' : 'OFF'}</span>
                </button>

                <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>

                <button onClick={onLogout} className="p-2.5 bg-slate-100/50 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-xl transition-all border border-transparent hover:border-rose-200" title="Cerrar Sesión">
                    <LogOut size={18} />
                </button>
            </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
        
        {/* BARRA DE HERRAMIENTAS */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6">
          <div className="flex flex-col md:flex-row flex-1 gap-4">
            <div className="relative w-full md:max-w-md group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={20} />
              <input type="text" placeholder="Buscar paciente o teléfono..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 md:py-3 rounded-2xl border border-slate-200 bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none shadow-sm text-sm font-medium transition-all hover:border-slate-300" />
            </div>
            
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 rounded-2xl px-5 py-3.5 md:py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm cursor-pointer hover:border-slate-300 transition-all">
              <option value="all">Todos los estados</option>
              <option value="Agendada">Agendada</option>
              <option value="Reprogramada">Reprogramada</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>

          <button onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 bg-accent-500 hover:bg-accent-600 text-white px-6 py-3.5 md:py-3 rounded-2xl font-bold transition-all shadow-md shadow-accent-500/20 hover:shadow-lg hover:shadow-accent-500/30 active:scale-95">
            <Plus size={22} /> <span className="md:inline">Nueva Cita</span>
          </button>
        </div>

        {/* --- VISTA MÓVIL (CARDS) --- */}
        <div className="md:hidden space-y-4">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((apt) => (
              <div key={apt.id} className="bg-white p-5 rounded-3xl shadow-card hover:shadow-card-hover transition-all border border-slate-100 relative overflow-hidden group">
                {/* Línea lateral de color */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 
                    ${apt.resource?.status === 'Agendada' ? 'bg-teal-500' : 
                      apt.resource?.status === 'Reprogramada' ? 'bg-amber-500' : 
                      apt.resource?.status === 'Cancelada' ? 'bg-rose-500' : 'bg-slate-300'}`}>
                </div>

                <div className="pl-2"> 
                    <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center text-brand-600 font-bold text-lg shadow-sm">
                            {apt.title.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 text-lg leading-tight">{apt.title}</h3>
                            <div className="mt-1"><StatusBadge status={apt.resource?.status} /></div>
                        </div>
                    </div>
                    {apt.resource?.source === 'ai' && (
                        <div className="bg-purple-50 p-1.5 rounded-lg text-purple-600 border border-purple-100 shadow-sm"><Bot size={18} /></div>
                    )}
                    </div>

                    <div className="space-y-2.5 text-sm text-slate-600 mb-5 bg-slate-50/80 p-4 rounded-2xl border border-slate-100/50">
                        <div className="flex items-center gap-3"><Calendar size={16} className="text-brand-500/70"/><span className="font-semibold text-slate-700 capitalize">{DateUtils.formatDate(apt.start)}</span></div>
                        <div className="flex items-center gap-3"><Clock size={16} className="text-brand-500/70"/><span className="font-medium">{DateUtils.formatTime(apt.start)}</span></div>
                        <div className="flex items-center gap-3"><FileText size={16} className="text-brand-500/70"/><span className="truncate font-medium">{apt.resource?.service || 'Consulta General'}</span></div>
                        
                        {/* --- DOCTOR EN MOVIL --- */}
                        <div className="flex items-center gap-3">
                            <Stethoscope size={16} className="text-brand-500/70"/>
                            <span className="font-medium text-indigo-600">
                                {apt.resource?.doctor || 'Sin asignar'}
                            </span>
                        </div>
                        
                        <div className="flex items-center gap-3"><Phone size={16} className="text-brand-500/70"/><span className="font-medium font-mono text-slate-700">{apt.resource?.phone || 'N/A'}</span></div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => handleOpenModal(apt)} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 text-sm font-bold transition-all active:scale-[0.98]">
                            <Edit2 size={16} /> Editar
                        </button>
                        {apt.resource?.status !== 'Cancelada' ? (
                            <button onClick={() => handleCancel(apt.id)} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white border-2 border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-300 text-sm font-bold transition-all active:scale-[0.98]">
                                <Ban size={16} /> Cancelar
                            </button>
                        ) : (
                            <button onClick={() => handleHardDelete(apt.id)} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white border-2 border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300 text-sm font-bold transition-all active:scale-[0.98]">
                                <Trash2 size={16} /> Eliminar
                            </button>
                        )}
                    </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState />
          )}
        </div>

        {/* --- VISTA PC (TABLA) --- */}
        <div className="hidden md:block bg-white rounded-3xl shadow-card border border-slate-200/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200">
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider first:rounded-tl-3xl">Paciente</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha y Hora</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Servicio</th>
                  {/* --- HEADER DOCTOR --- */}
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider">Especialista</th>
                  
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Estado</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Origen</th>
                  <th className="px-6 py-5 text-xs font-bold text-slate-500 uppercase tracking-wider text-right last:rounded-tr-3xl">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAppointments.length > 0 ? (
                  filteredAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-brand-50/40 transition-colors group">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-brand-100/60 flex items-center justify-center text-brand-700 font-bold shadow-sm ring-1 ring-brand-100">
                            {apt.title.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800">{apt.title}</p>
                            <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                              <Phone size={12} className="text-slate-400" /> <span className="font-mono">{apt.resource?.phone || 'Sin número'}</span>
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 capitalize">{DateUtils.formatDate(apt.start)}</span>
                          <span className="text-sm text-slate-500 font-medium mt-0.5">{DateUtils.formatTime(apt.start)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-medium text-slate-700 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200">{apt.resource?.service || 'Consulta'}</span>
                      </td>
                      
                      {/* --- CELDA DOCTOR EN TABLA --- */}
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-50 text-indigo-500 rounded-lg">
                                <Stethoscope size={14} />
                            </div>
                            <span className="text-sm font-semibold text-slate-700 truncate max-w-[140px]" title={apt.resource?.doctor}>
                                {apt.resource?.doctor || 'Sin asignar'}
                            </span>
                        </div>
                      </td>

                      <td className="px-6 py-5 text-center"><StatusBadge status={apt.resource?.status} /></td>
                      <td className="px-6 py-5 text-center">
                         {apt.resource?.source === 'ai' ? (
                           <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-purple-100 text-purple-600 border border-purple-200 shadow-sm" title="Agendado por IA"><Bot size={18} /></div>
                         ) : (
                           <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md border border-slate-200">Manual</span>
                         )}
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                          <button onClick={() => handleOpenModal(apt)} className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-100 rounded-xl transition-colors" title="Editar"><Edit2 size={18} /></button>
                          {apt.resource?.status !== 'Cancelada' ? (
                            <button onClick={() => handleCancel(apt.id)} className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-100 rounded-xl transition-colors" title="Cancelar"><Ban size={18} /></button>
                          ) : (
                            <button onClick={() => handleHardDelete(apt.id)} className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-100 rounded-xl transition-colors" title="Borrar Definitivamente"><Trash2 size={18} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="7"><EmptyState /></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL CITA (FORMULARIO) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden transform scale-100 transition-all flex flex-col max-h-[90vh] md:max-h-[85vh] animate-in slide-in-from-bottom-10 md:slide-in-from-center duration-300 border border-slate-200">
            <div className="bg-white px-6 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-slate-800">{editingAppointment ? 'Editar Cita' : 'Nueva Cita'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto">
               <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Nombre Paciente</label>
                  <input required type="text" className="w-full px-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none font-medium transition-all" placeholder="Ej: Juan Pérez" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Teléfono</label>
                        <input type="tel" className="w-full px-4 py-3.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none font-medium transition-all font-mono" placeholder="809..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Estado</label>
                        <select className="w-full px-4 py-3.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none font-medium transition-all appearance-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                            <option value="Agendada">Agendada</option>
                            <option value="Reprogramada">Reprogramada</option>
                            <option value="Cancelada">Cancelada</option>
                        </select>
                    </div>
                </div>

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Fecha</label>
                        <input required type="date" className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none font-medium transition-all" 
                          value={formData.start ? formData.start.split('T')[0] : ''} 
                          onChange={e => {
                            const newDate = e.target.value;
                            const currentTime = formData.start ? formData.start.split('T')[1]?.slice(0,5) : '09:00';
                            setFormData({...formData, start: `${newDate}T${currentTime}`});
                          }} 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Hora</label>
                        <select required className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none font-medium transition-all appearance-none"
                          value={formData.start ? formData.start.split('T')[1]?.slice(0,5) : ''}
                          onChange={e => {
                            const newTime = e.target.value;
                            const currentDate = formData.start ? formData.start.split('T')[0] : new Date().toISOString().split('T')[0];
                            setFormData({...formData, start: `${currentDate}T${newTime}`});
                          }}
                        >
                          <option value="" disabled>--:--</option>
                          {TIME_SLOTS.map((slot) => (<option key={slot.value} value={slot.value}>{slot.label}</option>))}
                        </select>
                      </div>
                   </div>

                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Servicio</label>
                      <select required className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none font-medium transition-all appearance-none" 
                        value={formData.service} onChange={e => setFormData({...formData, service: e.target.value})}>
                        <option value="" disabled>Selecciona servicio...</option>
                        <optgroup label="Odontología General">
                          <option value="Consulta odontológica general">Consulta General</option>
                          <option value="Profilaxis (limpieza dental)">Limpieza (Profilaxis)</option>
                          <option value="Radiografías">Radiografías</option>
                        </optgroup>
                        <optgroup label="Ortodoncia">
                          <option value="Ortodoncia (brackets)">Ortodoncia (Brackets)</option>
                          <option value="Activación de brackets">Activación de Brackets</option>
                        </optgroup>
                        <optgroup label="Estética y Prótesis">
                          <option value="Blanqueamiento dental">Blanqueamiento Dental</option>
                          <option value="Carillas">Carillas</option>
                          <option value="Prótesis / Puentes fijos">Prótesis / Puentes</option>
                          <option value="Implantes">Implantes</option>
                        </optgroup>
                        <optgroup label="Cirugía y Tratamientos">
                          <option value="Extracción">Extracción</option>
                          <option value="Endodoncia (tratamiento de canal)">Endodoncia (Canal)</option>
                          <option value="Gingivoplastia (cirugía de encías)">Gingivoplastia (Encías)</option>
                        </optgroup>
                      </select>
                   </div>

                   {/* --- SELECTOR DE DOCTOR --- */}
                   <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Especialista Asignado</label>
                      <select 
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none font-medium transition-all appearance-none" 
                        value={formData.doctor} 
                        onChange={e => setFormData({...formData, doctor: e.target.value})}
                      >
                        <option value="">-- Sin asignar / Automático --</option>
                        <option value="Dra. Marisol">Dra. Marisol</option>
                        <option value="Dra. Yelissa Quezada">Dra. Yelissa Quezada</option>
                        <option value="Dr. Jeffry Campusanos">Dr. Jeffry Campusanos</option>
                        <option value="Dr. Laureado Ortega">Dr. Laureado Ortega</option>
                        <option value="Dra. Pamela Paulino">Dra. Pamela Paulino</option>
                        <option value="Equipo Dental Space">Equipo Dental Space</option>
                      </select>
                   </div>

                </div>
              </div>
              
              <div className="flex gap-4 pt-4 shrink-0 pb-safe-area">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3.5 border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-[0.98]">Cancelar</button>
                <button type="submit" className="flex-1 py-3.5 bg-accent-500 text-white rounded-xl font-bold hover:bg-accent-600 shadow-lg shadow-accent-500/30 transition-all active:scale-[0.98]">
                    {loading ? 'Guardando...' : 'Guardar Cita'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- RENDERIZAR PANEL DE DOCTORES --- */}
      {isDoctorsOpen && (
        <DoctorsPanel onClose={() => setIsDoctorsOpen(false)} />
      )}

    </div>
  );
}

// Componente para estado vacío
const EmptyState = () => (
    <div className="text-center py-16 px-4 text-slate-400 bg-white rounded-3xl border-2 border-dashed border-slate-200/80 flex flex-col items-center justify-center gap-4">
        <div className="bg-slate-50 p-4 rounded-full"><Search size={40} className="text-slate-300" /></div>
        <div>
            <p className="text-lg font-semibold text-slate-600">No se encontraron citas</p>
            <p className="text-sm">Intenta cambiar los filtros o crea una nueva.</p>
        </div>
    </div>
);