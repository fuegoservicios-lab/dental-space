// src/Login.jsx
import React, { useState } from 'react';
import { User, Lock, ArrowRight, AlertCircle, CheckSquare } from 'lucide-react';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  // Nuevo estado para el checkbox (por defecto marcado para comodidad)
  const [rememberMe, setRememberMe] = useState(true);

  // --- CREDENCIALES ---
  const ADMIN_EMAIL = "admin@dentalspace.com";
  const ADMIN_PASS = "dental2025"; 
  // --------------------

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
      // LOGICA DE "MANTENER SESIÓN"
      if (rememberMe) {
        localStorage.setItem('dental_auth', 'true');   // Persistente (No se borra)
      } else {
        sessionStorage.setItem('dental_auth', 'true'); // Temporal (Se borra al cerrar)
      }
      onLogin();
    } else {
      setError('Credenciales incorrectas');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        
        {/* Header */}
        <div className="bg-blue-600 p-8 text-center">
            <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <img src="/logo-dental.png" alt="Logo" className="w-12 h-12 object-contain" />
            </div>
            <h2 className="text-2xl font-bold text-white">Dental Space</h2>
            <p className="text-blue-100 text-sm">Acceso Administrativo</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
            
            {error && (
                <div className="flex items-center gap-2 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100 animate-pulse">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Correo</label>
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="email" 
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="usuario@correo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase ml-1">Contraseña</label>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="password" 
                        required
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
            </div>

            {/* CHECKBOX "MANTENER SESIÓN" */}
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${rememberMe ? 'bg-blue-600 border-blue-600' : 'bg-white border-gray-300'}`}>
                    {rememberMe && <CheckSquare size={14} className="text-white" />}
                </div>
                <span className="text-sm text-gray-600 select-none">Mantener sesión iniciada</span>
            </div>

            <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-200 flex items-center justify-center gap-2 active:scale-95"
            >
                Entrar al Sistema <ArrowRight size={18} />
            </button>
        </form>
      </div>
    </div>
  );
}