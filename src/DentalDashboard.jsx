import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  RefreshCw, 
  Bot, 
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Phone,
  FileText,
  Ban,
  Calendar,
  Clock
} from 'lucide-react';

// --- CONFIGURACIÓN ---
const CONFIG = {
  USE_MOCK_DATA: false, 
  // Tu URL base de n8n
  API_BASE_URL: 'https://agente-de-citas-dental-space-n8n.ofcrls.easypanel.host/webhook', 
  ENDPOINTS: {
    GET: '/get-appointments', 
    TOGGLE_BOT: '/toggle-bot',
    CRUD: '/dashboard-action' // Endpoint del flujo CRUD
  }
};

// --- GENERADOR DE HORARIOS (INTERVALOS DE 30 MIN) ---
const generateTimeSlots = () => {
  const slots = [];
  let startHour = 8; // 8:00 AM
  let endHour = 19;  // 7:00 PM
  
  for (let i = startHour; i < endHour; i++) {
    const hour = i > 12 ? i - 12 : i;
    const ampm = i >= 12 ? 'PM' : 'AM';
    
    // Hora en punto
    slots.push({ 
      value: `${i.toString().padStart(2, '0')}:00`, 
      label: `${hour}:00 ${ampm}` 
    });
    
    // Hora y media
    slots.push({ 
      value: `${i.toString().padStart(2, '0')}:30`, 
      label: `${hour}:30 ${ampm}` 
    });
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
  },
  // Convierte fecha UTC a formato input local YYYY-MM-DDTHH:mm
  toInputFormat: (dateObj) => {
    if (!dateObj) return '';
    const d = new Date(dateObj);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  }
};

// Componente Helper para el Badge de Estado (Reutilizable)
const StatusBadge = ({ status }) => {
  const styles = 
    status === 'Agendada' ? 'bg-green-100 text-green-700 border-green-200' : 
    status === 'Reprogramada' ? 'bg-amber-100 text-amber-800 border-amber-200' : 
    status === 'Cancelada' ? 'bg-red-100 text-red-700 border-red-200' : 
    'bg-gray-100 text-gray-600';

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${styles}`}>
      {status || 'Pendiente'}
    </span>
  );
};

export default function DentalSpaceDashboard() {
  // --- ESTADOS ---
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [botActive, setBotActive] = useState(true); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); 
  
  // Estado del Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState(null); 
  const [formData, setFormData] = useState({
    title: '',
    phone: '',
    service: '',
    start: '',
    status: 'Agendada',
    source: 'manual'
  });

  // --- API: CARGAR DATOS (GET) ---
  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.GET}`);
      if (!response.ok) throw new Error('Error al cargar datos');
      
      const jsonResponse = await response.json();
      const rawData = jsonResponse.data || [];
      
      const cleanData = rawData.map(apt => ({
        ...apt,
        start: new Date(apt.start),
        end: new Date(apt.end)
      }));

      // Ordenar por fecha (más recientes primero)
      cleanData.sort((a, b) => b.start - a.start);
      setAppointments(cleanData);

      if (typeof jsonResponse.botActive !== 'undefined') {
        setBotActive(jsonResponse.botActive);
      }

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- API: CONTROL DEL BOT (POST) ---
  const toggleBot = async () => {
    const newState = !botActive;
    setBotActive(newState); 
    
    try {
      await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.TOGGLE_BOT}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newState })
      });
      console.log(`Bot estado cambiado a: ${newState}`);
    } catch (error) {
      console.error("Error toggling bot:", error);
      setBotActive(!newState); 
      alert("No se pudo cambiar el estado del bot. Revisa tu conexión.");
    }
  };

  useEffect(() => {
    fetchAppointments();
    const interval = setInterval(fetchAppointments, 10000); 
    return () => clearInterval(interval);
  }, [fetchAppointments]);

  // --- LÓGICA DEL FORMULARIO (MODAL) ---
  const handleOpenModal = (appointment = null) => {
    if (appointment) {
      setEditingAppointment(appointment);
      
      // Convertir fecha existente a formato ISO limpio para los inputs
      const d = new Date(appointment.start);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      const isoString = d.toISOString().slice(0, 16); 

      setFormData({
        title: appointment.title,
        phone: appointment.resource?.phone || '',
        service: appointment.resource?.service || '',
        start: isoString,
        status: appointment.resource?.status || 'Agendada',
        source: appointment.resource?.source || 'manual'
      });
    } else {
      setEditingAppointment(null);
      
      // Fecha por defecto: Hoy a las 9:00 AM
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      const today = now.toISOString().split('T')[0];

      setFormData({
        title: '',
        phone: '',
        service: '', 
        start: `${today}T09:00`,
        status: 'Agendada',
        source: 'manual'
      });
    }
    setIsModalOpen(true);
  };

  // --- API: GUARDAR (CREAR / EDITAR) ---
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);

    const startDate = new Date(formData.start);
    const endDate = new Date(startDate.getTime() + 30 * 60000); 

    const actionType = editingAppointment ? 'update' : 'create';

    const networkPayload = {
        action: actionType,
        data: {
            title: formData.title,
            phone: formData.phone,
            service: formData.service,
            status: formData.status,
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            
            // IDs para editar
            id: editingAppointment?.id, 
            eventId: editingAppointment?.resource?.eventId 
        }
    };

    try {
        const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.CRUD}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(networkPayload)
        });

        if (!response.ok) throw new Error('Error al guardar en el servidor');
        
        await fetchAppointments(); 
        setIsModalOpen(false);

    } catch (error) {
        console.error("Error saving appointment:", error);
        alert("Hubo un error al guardar la cita. Intenta de nuevo.");
    } finally {
        setLoading(false);
    }
  };

  // --- API: PASO 1 - CANCELAR (SOFT DELETE) ---
  const handleCancel = async (id) => {
    const appointmentToCancel = appointments.find(a => a.id === id);
    if (!appointmentToCancel) return;

    if (window.confirm('¿Seguro que deseas CANCELAR esta cita?\n\n- Se eliminará de Google Calendar.\n- Quedará como "Cancelada" en el historial.')) {
      setLoading(true);
      try {
          const networkPayload = {
              action: 'delete', 
              data: {
                  id: id, 
                  eventId: appointmentToCancel.resource?.eventId 
              }
          };

          const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.CRUD}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(networkPayload)
          });

          if (!response.ok) throw new Error('Error al cancelar');

          await fetchAppointments();

      } catch (error) {
          console.error("Error canceling:", error);
          alert("No se pudo cancelar la cita.");
      } finally {
          setLoading(false);
      }
    }
  };

  // --- API: PASO 2 - ELIMINAR DEFINITIVAMENTE (HARD DELETE) ---
  const handleHardDelete = async (id) => {
    if (window.confirm('⚠️ ¿Borrar este registro DEFINITIVAMENTE?\n\nEsta acción borrará la cita de la base de datos y no se puede deshacer.')) {
      setLoading(true);
      try {
          const networkPayload = {
              action: 'hard_delete', 
              data: { id: id }
          };

          const response = await fetch(`${CONFIG.API_BASE_URL}${CONFIG.ENDPOINTS.CRUD}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(networkPayload)
          });

          if (!response.ok) throw new Error('Error al eliminar definitivamente');

          await fetchAppointments();

      } catch (error) {
          console.error("Error hard deleting:", error);
          alert("No se pudo eliminar el registro.");
      } finally {
          setLoading(false);
      }
    }
  };

  // --- FILTROS ---
  const filteredAppointments = appointments.filter(apt => {
    const matchesSearch = apt.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (apt.resource?.phone || '').includes(searchTerm);
    const matchesStatus = filterStatus === 'all' || apt.resource?.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // --- RENDERIZADO ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900 pb-20 md:pb-0">
      
      {/* HEADER RESPONSIVO CON LOGO IMAGEN */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              {/* IMAGEN DEL LOGO DESDE LA CARPETA PUBLIC */}
              <img 
                  src="/logo-dental.png" 
                  alt="Dental Space Logo" 
                  className="w-10 h-10 md:w-12 md:h-12 object-contain"
              />
              
              <div>
                  <h1 className="text-lg md:text-xl font-bold text-gray-800 leading-tight">Panel Admin</h1>
                  <p className="hidden md:block text-xs text-gray-500">Gestión Dental Space</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
                <button onClick={fetchAppointments} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-600 transition-colors">
                    <RefreshCw size={18} className={loading ? "animate-spin text-blue-600" : ""} />
                </button>
                
                <button 
                    onClick={toggleBot}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all shadow-sm
                    ${botActive 
                        ? 'bg-green-100 text-green-700 border-green-300' 
                        : 'bg-red-50 text-red-600 border-red-200'}`}
                >
                    <div className={`w-2 h-2 rounded-full ${botActive ? 'bg-green-500 animate-pulse' : 'bg-red-400'}`}></div>
                    {botActive ? 'IA ON' : 'IA PAUSA'}
                </button>
            </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
        
        {/* BARRA DE HERRAMIENTAS RESPONSIVA */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3 mb-5">
          <div className="flex flex-col md:flex-row flex-1 gap-3">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar paciente o teléfono..." 
                className="w-full pl-10 pr-4 py-3 md:py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none shadow-sm text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select 
              className="bg-white border border-gray-300 text-gray-700 rounded-xl px-4 py-3 md:py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Todos los estados</option>
              <option value="Agendada">Agendada</option>
              <option value="Reprogramada">Reprogramada</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>

          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 md:py-2.5 rounded-xl font-medium transition-all shadow-md shadow-blue-200 active:scale-95"
          >
            <Plus size={20} />
            <span className="md:inline">Nueva Cita</span>
          </button>
        </div>

        {/* --- VISTA MÓVIL (CARDS) --- */}
        <div className="md:hidden space-y-3">
          {filteredAppointments.length > 0 ? (
            filteredAppointments.map((apt) => (
              <div key={apt.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative">
                
                {/* Cabecera Card */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                        {apt.title.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800">{apt.title}</h3>
                        <StatusBadge status={apt.resource?.status} />
                    </div>
                  </div>
                  {/* Origen (Icono) */}
                  {apt.resource?.source === 'ai' && (
                     <Bot size={16} className="text-purple-500" />
                  )}
                </div>

                {/* Detalles Card */}
                <div className="space-y-2 text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-gray-400"/>
                        <span className="font-medium text-gray-800">{DateUtils.formatDate(apt.start)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock size={14} className="text-gray-400"/>
                        <span>{DateUtils.formatTime(apt.start)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <FileText size={14} className="text-gray-400"/>
                        <span className="truncate">{apt.resource?.service || 'Consulta'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Phone size={14} className="text-gray-400"/>
                        <span>{apt.resource?.phone || 'N/A'}</span>
                    </div>
                </div>

                {/* Botones de Acción (Full Width en Móvil) */}
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => handleOpenModal(apt)}
                        className="flex items-center justify-center gap-1 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium"
                    >
                        <Edit2 size={14} /> Editar
                    </button>
                    
                    {apt.resource?.status !== 'Cancelada' ? (
                        <button 
                            onClick={() => handleCancel(apt.id)}
                            className="flex items-center justify-center gap-1 py-2 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 hover:bg-amber-100 text-sm font-medium"
                        >
                            <Ban size={14} /> Cancelar
                        </button>
                    ) : (
                        <button 
                            onClick={() => handleHardDelete(apt.id)}
                            className="flex items-center justify-center gap-1 py-2 rounded-lg bg-red-50 border border-red-100 text-red-600 hover:bg-red-100 text-sm font-medium"
                        >
                            <Trash2 size={14} /> Borrar
                        </button>
                    )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
                <p>No hay citas</p>
            </div>
          )}
        </div>

        {/* --- VISTA PC (TABLA) --- */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Paciente</th>
                  <th className="px-6 py-4">Fecha y Hora</th>
                  <th className="px-6 py-4">Servicio</th>
                  <th className="px-6 py-4 text-center">Estado</th>
                  <th className="px-6 py-4 text-center">Origen</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAppointments.length > 0 ? (
                  filteredAppointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold">
                            {apt.title.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{apt.title}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone size={10} /> {apt.resource?.phone || 'Sin número'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-800 capitalize">{DateUtils.formatDate(apt.start)}</span>
                          <span className="text-sm text-gray-500">{DateUtils.formatTime(apt.start)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-700 bg-gray-100 px-2 py-1 rounded">{apt.resource?.service || 'Consulta'}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StatusBadge status={apt.resource?.status} />
                      </td>
                      <td className="px-6 py-4 text-center">
                         {apt.resource?.source === 'ai' ? (
                           <div title="Agendado por IA" className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 border border-purple-200">
                             <Bot size={16} />
                           </div>
                         ) : (
                           <span className="text-xs text-gray-400">Manual</span>
                         )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenModal(apt)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Editar">
                            <Edit2 size={16} />
                          </button>
                          {apt.resource?.status !== 'Cancelada' ? (
                            <button onClick={() => handleCancel(apt.id)} className="p-2 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg" title="Cancelar">
                              <Ban size={16} />
                            </button>
                          ) : (
                            <button onClick={() => handleHardDelete(apt.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Borrar">
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Search size={40} className="text-gray-200" />
                        <p>No se encontraron citas.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL RESPONSIVO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform scale-100 transition-all flex flex-col max-h-[90vh]">
            
            <div className="bg-white px-5 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {editingAppointment ? 'Editar Cita' : 'Nueva Cita'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20} /></button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Paciente</label>
                  <input required type="text" className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: Juan Pérez" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono</label>
                        <input type="tel" className="w-full px-3 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="809-..." value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Estado</label>
                        <select className="w-full px-3 py-3 border rounded-xl bg-white" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                            <option value="Agendada">Agendada</option>
                            <option value="Reprogramada">Reprogramada</option>
                            <option value="Cancelada">Cancelada</option>
                        </select>
                    </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                   <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha</label>
                        <input required type="date" className="w-full px-3 py-2.5 border rounded-lg bg-white" 
                          value={formData.start ? formData.start.split('T')[0] : ''} 
                          onChange={e => {
                            const newDate = e.target.value;
                            const currentTime = formData.start ? formData.start.split('T')[1]?.slice(0,5) : '09:00';
                            setFormData({...formData, start: `${newDate}T${currentTime}`});
                          }} 
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hora</label>
                        <select required className="w-full px-3 py-2.5 border rounded-lg bg-white"
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
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Servicio</label>
                      <select 
                        required 
                        className="w-full px-3 py-2.5 border rounded-lg bg-white appearance-none" 
                        value={formData.service} 
                        onChange={e => setFormData({...formData, service: e.target.value})}
                      >
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
                </div>
              </div>

              <div className="flex gap-3 pt-4 shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50">Cancelar</button>
                <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-lg shadow-blue-200">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}