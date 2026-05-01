import React, { useState, useEffect } from 'react';
import Header from './Header'; 
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Importamos todas las pantallas nuevas
import Prestadores from './Prestadores';
import RegistrarUsuario from './RegistrarUsuario';
import Bitacora from './Bitacora';
import Asistencia from './Asistencia';
import Evidencias from './Evidencias';
import Reportes from './Reportes'; 
import MiEstado from './MiEstado';
import EstadoPrestadores from './EstadoPrestadores';

const GUINDA_IPN = '#750946';

const Dashboard = ({ role, onLogout }) => {
  const [activeView, setActiveView] = useState(null);
  const [estadoUsuario, setEstadoUsuario] = useState('Activo'); 

  // Consultamos la base de datos apenas carga el tablero
  useEffect(() => {
    if (role === 'Prestador de Servicio') {
      const nombreUsuario = localStorage.getItem('userName');
      fetch(`http://localhost:5000/api/mi-estado/${nombreUsuario}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.estado_servicio) {
            setEstadoUsuario(data.estado_servicio);
            // Si está de baja O liberado, lo forzamos a entrar a su estado inmediatamente
            if (data.estado_servicio === 'Baja' || data.estado_servicio === 'Liberado') {
              setActiveView('Mi Estado');
            }
          }
        })
        .catch(err => console.error("Error verificando el estado del usuario:", err));
    }
  }, [role]);

  const menus = {
    "Prestador de Servicio": [ 
      "Bitácora", "Asistencia", "Evidencias", "Mi Estado", "Reportes" 
    ],
    "Jefe de UDI": [ 
      "Prestadores", "Registrar Nuevo Usuario", "Bitácora", 
      "Asistencia", "Evidencias", "Estado Prestadores", "Reportes" 
    ],
    "Empleado de UDI": [ 
      "Reportes", "Asistencia", "Bitácora", "Evidencias", "Mi estado"
    ]
  };

  const iconos = {
    "Bitácora": "📝",
    "Asistencia": "⏱️",
    "Evidencias": "📸",
    "Reportes": "📄",
    "Mi Estado": "📊",
    "Mi estado": "📊",
    "Prestadores": "👥",
    "Registrar Nuevo Usuario": "➕",
    "Estado Prestadores": "📈"
  };

  // Variable de control para saber si debemos bloquear la interfaz
  const isRestricted = estadoUsuario === 'Baja' || estadoUsuario === 'Liberado';

  // Si está restringido, su menú se reduce a un solo botón
  let currentMenu = menus[role] || [];
  if (role === 'Prestador de Servicio' && isRestricted) {
    currentMenu = ["Mi Estado"];
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'Prestadores': return <Prestadores />;
      case 'Registrar Nuevo Usuario': return <RegistrarUsuario />;
      case 'Bitácora': return <Bitacora />;
      case 'Asistencia': return <Asistencia />;
      case 'Evidencias': return <Evidencias />;
      case 'Reportes': return <Reportes />;
      case 'Mi Estado':
      case 'Mi estado': return <MiEstado />;
      case 'Estado Prestadores': return <EstadoPrestadores />;
      default: return <p>Pantalla no encontrada o en construcción.</p>;
    }
  };

  if (activeView) {
    return (
      <div style={{ backgroundColor: '#f9f9f9', minHeight: '100vh', fontFamily: 'Montserrat, sans-serif' }}>
        <Header />
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            {!isRestricted ? (
              <button 
                onClick={() => setActiveView(null)}
                style={{ padding: '8px 15px', backgroundColor: '#636569', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
              >
                ← Regresar al Tablero
              </button>
            ) : (
              <div style={{ color: estadoUsuario === 'Liberado' ? '#2e7d32' : '#d32f2f', fontWeight: 'bold' }}>
                {estadoUsuario === 'Liberado' ? '🎉 Servicio Concluido' : '🚫 Acceso Restringido'}
              </div>
            )}
            
            <button onClick={onLogout} style={{ padding: '8px 16px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>Cerrar Sesión</button>
          </div>

          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', border: `2px solid ${GUINDA_IPN}`, textAlign: 'center' }}>
            {renderActiveView()}
          </div>

        </div>
        {/* Contenedor de notificaciones para las vistas activas */}
        <ToastContainer position="bottom-right" autoClose={3000} theme="colored" />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#f9f9f9', minHeight: '100vh', fontFamily: 'Montserrat, sans-serif' }}>
      <Header />
      <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: GUINDA_IPN }}>Tablero: {role}</h2>
          <button onClick={onLogout} style={{ padding: '8px 16px', backgroundColor: '#636569', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cerrar Sesión</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', justifyContent: 'center', padding: '0 20px' }}>
          {currentMenu.map((btnName, index) => (
            <button 
              key={index} 
              onClick={() => setActiveView(btnName)}
              style={{
                padding: '25px 15px', backgroundColor: 'white', border: `2px solid ${GUINDA_IPN}`, color: GUINDA_IPN, fontWeight: 'bold', fontSize: '1.1rem', borderRadius: '12px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', transition: 'all 0.3s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'
              }}
              onMouseOver={(e) => { 
                e.currentTarget.style.backgroundColor = GUINDA_IPN; 
                e.currentTarget.style.color = 'white'; 
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
              }}
              onMouseOut={(e) => { 
                e.currentTarget.style.backgroundColor = 'white'; 
                e.currentTarget.style.color = GUINDA_IPN; 
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
              }}
            >
              <span style={{ fontSize: '2rem' }}>{iconos[btnName] || '🔘'}</span>
              {btnName}
            </button>
          ))}
        </div>

        {/* Contenedor de notificaciones para el menú principal */}
        <ToastContainer position="bottom-right" autoClose={3000} theme="colored" />
      </div>
    </div>
  );
};

export default Dashboard;