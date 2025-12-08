// src/Login.jsx
import React, { useState } from 'react';
import { User, Lock, ArrowRight, AlertCircle, CheckSquare } from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Estado para "Recordarme" (marcado por defecto para mejor UX)
  const [rememberMe, setRememberMe] = useState(true);

  // --- CREDENCIALES ACTUALIZADAS ---
  const ADMIN_EMAIL = "yelissa_qv@hotmail.com";
  const ADMIN_PASS = "dentalspace"; 
  // ---------------------------------

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
      // LOGICA DE "MANTENER SESIÓN"
      if (rememberMe) {
        localStorage.setItem('dental_auth', 'true');   // Persistente
      } else {
        sessionStorage.setItem('dental_auth', 'true'); // Temporal
      }
      onLogin();
    } else {
      setError('Credenciales incorrectas. Intenta de nuevo.');
    }
  };

  return (
    // Fondo general con un degradado sutil
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-brand-50 flex items-center justify-center p-4 font-sans">
      
      {/* Tarjeta de Login */}
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
        
        {/* Header con degradado corporativo */}
        <div className="bg-linear-to-r from-brand-600 to-brand-700 p-8 text-center relative overflow-hidden">
            
            {/* Elemento decorativo de fondo */}
            <div className="absolute top-0 left-0 w-full h-full bg-white opacity-5 transform -skew-y-6 scale-150 origin-top-left"></div>

            {/* Logo */}
            <div className="bg-white/95 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg backdrop-blur-sm relative z-10 p-4 overflow-hidden">
                <img src="/logo-dental.png" alt="Logo Dental Space" className="w-full h-full object-contain" />
            </div>
            
            {/* Títulos */}
            <h2 className="text-3xl font-bold text-white relative z-10 tracking-tight">Dental Space</h2>
            <p className="text-brand-100 text-sm font-medium relative z-10 mt-1">Portal Administrativo</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
            
            {/* Mensaje de Error */}
            {error && (
                <div className="flex items-center gap-3 bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={18} className="shrink-0" />
                    <span className="font-medium">{error}</span>
                </div>
            )}

            {/* Input Correo */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Correo Electrónico</label>
                <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors duration-200" size={20} />
                    <input 
                        type="email" 
                        required
                        className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all duration-200 font-medium text-slate-800 placeholder:text-slate-400"
                        placeholder="usuario@dentalspace.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
            </div>

            {/* Input Contraseña */}
            <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Contraseña</label>
                <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors duration-200" size={20} />
                    <input 
                        type="password" 
                        required
                        className="w-full pl-12 pr-4 py-4 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all duration-200 font-medium text-slate-800 placeholder:text-slate-400"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
            </div>

            {/* Checkbox "Recordarme" */}
            <div className="flex items-center gap-3 cursor-pointer group select-none" onClick={() => setRememberMe(!rememberMe)}>
                <div className={`w-6 h-6 rounded-[0.4rem] border-2 flex items-center justify-center transition-all duration-200 ${rememberMe ? 'bg-brand-600 border-brand-600 shadow-sm shadow-brand-200' : 'bg-slate-50 border-slate-300 group-hover:border-brand-400'}`}>
                    {rememberMe && <CheckSquare size={16} className="text-white" />}
                </div>
                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors">Mantener sesión iniciada</span>
            </div>

            {/* Botón de Submit */}
            <button 
                type="submit" 
                className="w-full bg-accent-500 hover:bg-accent-600 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-accent-500/30 hover:shadow-accent-500/50 flex items-center justify-center gap-2 active:scale-[0.98] text-lg mt-2"
            >
                Entrar al Sistema <ArrowRight size={20} />
            </button>
        </form>
      </div>
    </div>
  );
}