import React, { useState } from 'react';
import DentalSpaceDashboard from './DentalDashboard';
import Login from './Login';

function App() {
  // SOLUCIÓN: "Lazy Initialization"
  // En lugar de usar useEffect, leemos el localStorage directamente dentro de useState.
  // Esto elimina el error y hace que la carga sea instantánea.
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const savedAuth = localStorage.getItem('dental_auth');
    return savedAuth === 'true';
  });

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('dental_auth');
    setIsAuthenticated(false);
  };

  // Si NO está autenticado, mostramos el Login
  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  // Si SÍ está autenticado, mostramos el Dashboard
  return (
    <DentalSpaceDashboard onLogout={handleLogout} />
  );
}

export default App;