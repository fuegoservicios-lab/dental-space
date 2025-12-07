// src/App.jsx
import React, { useState } from 'react';
import DentalSpaceDashboard from './DentalDashboard';
import Login from './Login';

function App() {
  // --- ACTUALIZADO ---
  // Ahora revisamos AMBOS almacenamientos al iniciar
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const localAuth = localStorage.getItem('dental_auth');
    const sessionAuth = sessionStorage.getItem('dental_auth');
    
    // Si existe en cualquiera de los dos, dejamos pasar
    return localAuth === 'true' || sessionAuth === 'true';
  });

  // Función para cerrar sesión (Limpiamos TODO para asegurar que salga)
  const handleLogout = () => {
    localStorage.removeItem('dental_auth');
    sessionStorage.removeItem('dental_auth');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <DentalSpaceDashboard onLogout={handleLogout} />
  );
}

export default App;