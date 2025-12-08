// src/DoctorsPanel.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
// CORRECCIÓN: Cambiamos UserMd por Users porque UserMd no existe en algunas versiones
import { X, Users, Stethoscope, Clock, AlertCircle } from 'lucide-react';

export default function DoctorsPanel({ onClose }) {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. Cargar doctores al montar el componente
  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      // Traemos la lista ordenada por ID
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

  // 2. Función para alternar el interruptor (Switch)
  const toggleDoctor = async (id, currentStatus, doctorName) => {
    const newStatus = !currentStatus;

    // A. Actualización Optimista
    setDoctors(prev => prev.map(doc => 
      doc.id === id ? { ...doc, is_active: newStatus } : doc
    ));

    try {
      // B. Actualización en Base de Datos
      const { error } = await supabase
        .from('doctors_config')
        .update({ is_active: newStatus })
        .eq('id', id);

      if (error) throw error;

    } catch (error) {
      console.error('Error actualizando:', error);
      alert(`No se pudo actualizar el estado de ${doctorName}.`);
      
      // C. Rollback
      setDoctors(prev => prev.map(doc => 
        doc.id === id ? { ...doc, is_active: currentStatus } : doc
      ));
    }
  };

  return (
    // Fondo oscuro (Backdrop)
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Contenedor Modal */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border border-slate-200">
        
        {/* Header */}
        <div className="bg-white px-6 py-5 border-b border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600 border border-indigo-100">
                {/* CORRECCIÓN: Usamos el icono Users en lugar de UserMd */}
                <Users size={24} />
             </div>
             <div>
                <h3 className="text-xl font-bold text-slate-800 leading-tight">Especialistas</h3>
                <p className="text-xs text-slate-500 font-medium">Gestiona la disponibilidad del equipo</p>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            title="Cerrar"
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
                <p>No se encontraron doctores en la base de datos.</p>
            </div>
          ) : (
            doctors.map((doc) => (
              <div 
                key={doc.id} 
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 
                  ${doc.is_active 
                    ? 'bg-white border-slate-200 shadow-sm' 
                    : 'bg-slate-50 border-slate-200/60 opacity-60 grayscale-[0.5]'
                  }`}
              >
                
                <div className="flex items-center gap-4">
                  {/* Avatar con Iniciales */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold transition-colors 
                    ${doc.is_active 
                      ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' 
                      : 'bg-slate-200 text-slate-400 border border-slate-300'
                    }`}
                  >
                    {doc.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div>
                    <h4 className={`font-bold text-base leading-tight ${doc.is_active ? 'text-slate-800' : 'text-slate-500'}`}>
                      {doc.name}
                    </h4>
                    
                    {/* Metadatos (Servicios y Días) */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1 font-medium">
                        <div className="flex items-center gap-1">
                          <Stethoscope size={12} className={doc.is_active ? "text-indigo-400" : "text-slate-400"} />
                          <span className="truncate max-w-32 sm:max-w-40">
                            {doc.services_letters?.join(', ') || 'N/A'}
                          </span>
                        </div>
                        <span className="text-slate-300">|</span>
                        <div className="flex items-center gap-1">
                          <Clock size={12} className={doc.is_active ? "text-indigo-400" : "text-slate-400"} />
                          <span>
                            {doc.schedule?.days?.length || 0} Días
                          </span>
                        </div>
                    </div>
                  </div>
                </div>

                {/* Switch Toggle */}
                <label className="relative inline-flex items-center cursor-pointer group">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={doc.is_active}
                    onChange={() => toggleDoctor(doc.id, doc.is_active, doc.name)}
                    aria-label={`Cambiar disponibilidad de ${doc.name}`}
                  />
                  {/* Fondo del switch */}
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500 shadow-inner transition-colors"></div>
                </label>
              </div>
            ))
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400 font-medium">
               Estado: <span className="text-indigo-500 font-semibold">Sincronizado con Supabase</span>
            </p>
        </div>
      </div>
    </div>
  );
}