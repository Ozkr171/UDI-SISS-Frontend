import React, { useState } from 'react';
import Header from './components/Header'; 
import LoginScreen from './components/LoginScreen'; 
import Dashboard from './components/Dashboard';

function App() {
  // Al iniciar, revisamos si ya hay un rol y nombre guardados en el navegador
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));
  const [userName, setUserName] = useState(localStorage.getItem('userName'));

  const handleLoginSuccess = (role, nombre) => {
    // Guardamos en el estado de React
    setUserRole(role);
    setUserName(nombre);
    // Guardamos en la memoria del navegador para que sobreviva al F5
    localStorage.setItem('userRole', role);
    localStorage.setItem('userName', nombre);
  };

  const handleLogout = () => {
    // Limpiamos todo al salir
    setUserRole(null);
    setUserName(null);
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
  };

  // Si ya tiene rol, le mostramos su tablero completo
  if (userRole) {
    return <Dashboard role={userRole} userName={userName} onLogout={handleLogout} />;
  }

  // Si no tiene rol, le mostramos el login
  return (
    <div style={{ backgroundColor: '#f9f9f9', minHeight: '100vh', fontFamily: 'Montserrat, sans-serif' }}>
      <Header />
      <main style={{ padding: '20px' }}>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </main>
    </div>
  );
}

export default App;