// src/DoctorsPanel.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { X, Users, Stethoscope, Clock, AlertCircle, Power, Hourglass } from 'lucide-react';

export default function DoctorsPanel({ onClose }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el modal de pausa temporal
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [pauseHours, setPauseHours] = useState(1);

  // 1. Cargar doctores
  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('doctors_config')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error cargando doctores:', error);
    } finally {
      setLoading(false);
    }
  };

  // 2. Manejar el click en el Switch
  const handleToggleClick = (doctor) => {
    // CASO A: El doctor está activo (o pausado temporalmente) -> Queremos apagarlo o pausarlo
    if (doctor.is_active) {
      setSelectedDoctor(doctor); // Abrimos el modal de opciones
      setPauseHours(1); // Reset a 1 hora por defecto
    } 
    // CASO B: El doctor está totalmente apagado -> Lo encendemos
    else {
      updateDoctorStatus(doctor.id, true, null);
    }
  };

  // 3. Función que envía los datos a Supabase
  const updateDoctorStatus = async (id, isActive, pausedUntil) => {
    // Actualización Optimista (Visual inmediata)
    setDoctors(prev => prev.map(doc => 
      doc.id === id ? { ...doc, is_active: isActive, paused_until: pausedUntil } : doc
    ));
    
    // Cerrar modal si estaba abierto
    setSelectedDoctor(null);

    try {
      const { error } = await supabase
        .from('doctors_config')
        .update({ 
          is_active: isActive,
          paused_until: pausedUntil 
        })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error actualizando:', error);
      alert('No se pudo actualizar el estado.');
      fetchDoctors(); // Revertir cambios trayendo datos reales
    }
  };

  // 4. Confirmar Pausa por Horas
  const confirmPause = () => {
    if (!selectedDoctor) return;
    
    // Calcular fecha futura
    const now = new Date();
    const futureDate = new Date(now.getTime() + pauseHours * 60 * 60 * 1000);
    
    // Guardamos: is_active = TRUE (porque técnicamente trabaja hoy, solo está en break)
    // paused_until = FECHA FUTURA
    updateDoctorStatus(selectedDoctor.id, true, futureDate.toISOString());
  };

  // 5. Confirmar Apagado Total
  const confirmShutdown = () => {
    if (!selectedDoctor) return;
    updateDoctorStatus(selectedDoctor.id, false, null);
  };

  // Helper para formatear hora
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-DO', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Helper para saber si está pausado actualmente
  const isPaused = (doc) => {
    if (!doc.paused_until) return false;
    return new Date(doc.paused_until) > new Date();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Contenedor Modal */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border border-slate-200 relative">
        
        {/* Header */}
        <div className="bg-white px-6 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600 border border-indigo-100">
                <Users size={24} />
             </div>
             <div>
                <h3 className="text-xl font-bold text-slate-800 leading-tight">Especialistas</h3>
                <p className="text-xs text-slate-500 font-medium">Gestiona la disponibilidad</p>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo / Lista */}
        <div className="p-6 overflow-y-auto space-y-4 bg-slate-50/50 flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium">Cargando equipo...</span>
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-10 text-slate-400 flex flex-col items-center gap-2">
                <AlertCircle size={32} className="opacity-50"/>
                <p>No se encontraron doctores.</p>
            </div>
          ) : (
            doctors.map((doc) => {
              const paused = isPaused(doc);
              const active = doc.is_active;

              return (
                <div 
                  key={doc.id} 
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 
                    ${active 
                      ? (paused ? 'bg-amber-50 border-amber-200 shadow-sm' : 'bg-white border-slate-200 shadow-sm') 
                      : 'bg-slate-50 border-slate-200/60 opacity-60 grayscale-[0.5]'
                    }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold transition-colors 
                      ${active 
                        ? (paused ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-indigo-50 text-indigo-600 border border-indigo-100')
                        : 'bg-slate-200 text-slate-400 border border-slate-300'
                      }`}
                    >
                      {doc.name.charAt(0).toUpperCase()}
                    </div>
                    
                    <div>
                      <h4 className={`font-bold text-base leading-tight ${active ? 'text-slate-800' : 'text-slate-500'}`}>
                        {doc.name}
                      </h4>
                      
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-medium">
                          {active && paused ? (
                            <div className="flex items-center gap-1 text-amber-600 font-bold bg-amber-100/50 px-2 py-0.5 rounded-md border border-amber-100">
                              <Hourglass size={12} />
                              <span>Vuelve: {formatTime(doc.paused_until)}</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-1">
                                <Stethoscope size={12} className={active ? "text-indigo-400" : "text-slate-400"} />
                                <span className="truncate max-w-32">{doc.services_letters?.join(', ') || 'N/A'}</span>
                              </div>
                            </>
                          )}
                      </div>
                    </div>
                  </div>

                  {/* Switch Manual */}
                  <div onClick={() => handleToggleClick(doc)} className="cursor-pointer">
                    <div className={`w-11 h-6 rounded-full relative transition-colors shadow-inner
                      ${active 
                        ? (paused ? 'bg-amber-400' : 'bg-indigo-500') 
                        : 'bg-slate-200'
                      }`}
                    >
                      <div className={`absolute top-0.5 left-0.5 bg-white border border-gray-200 rounded-full h-5 w-5 transition-transform shadow-sm
                        ${active ? 'translate-x-5 border-transparent' : 'translate-x-0'}
                      `}></div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-medium">
               Botón ON/OFF: <span className="text-indigo-500 font-semibold">Abre menú de pausa</span>
            </p>
        </div>

        {/* --- MODAL INTERNO DE PAUSA --- */}
        {selectedDoctor && (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-10 flex flex-col items-center justify-center p-6 animate-in fade-in slide-in-from-bottom-5 duration-200">
            <div className="w-full max-w-sm text-center space-y-6">
              
              <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 mb-2">
                <Power size={32} />
              </div>
              
              <div>
                <h3 className="text-lg font-bold text-slate-800">Gestionar Disponibilidad</h3>
                <p className="text-sm text-slate-500">¿Qué deseas hacer con <span className="font-semibold text-indigo-600">{selectedDoctor.name}</span>?</p>
              </div>

              {/* Opción A: Pausar por horas */}
              <div className="bg-white border-2 border-indigo-100 rounded-2xl p-4 shadow-sm hover:border-indigo-300 transition-all">
                <p className="text-sm font-bold text-slate-700 mb-3 flex items-center justify-center gap-2">
                  <Clock size={16} className="text-indigo-500"/> Pausar temporalmente
                </p>
                <div className="flex items-center justify-center gap-3">
                   <button 
                    onClick={() => setPauseHours(h => Math.max(1, h - 1))}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600"
                   >-</button>
                   <span className="text-xl font-bold w-12">{pauseHours} h</span>
                   <button 
                    onClick={() => setPauseHours(h => Math.min(12, h + 1))}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600"
                   >+</button>
                </div>
                <button 
                  onClick={confirmPause}
                  className="mt-4 w-full py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/30 active:scale-95 transition-all"
                >
                  Confirmar Pausa
                </button>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-300 font-bold uppercase tracking-widest justify-center">
                <div className="h-px bg-slate-200 w-full"></div>
                O
                <div className="h-px bg-slate-200 w-full"></div>
              </div>

              {/* Opción B: Apagar */}
              <button 
                onClick={confirmShutdown}
                className="w-full py-3 bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 rounded-xl font-bold text-sm transition-all"
              >
                Apagar indefinidamente
              </button>

              <button onClick={() => setSelectedDoctor(null)} className="text-xs font-bold text-slate-400 hover:text-slate-600 underline">
                Cancelar
              </button>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}