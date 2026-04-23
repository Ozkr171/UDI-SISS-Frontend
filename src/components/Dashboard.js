import React, { useState } from 'react';
import Header from './Header'; // Asegúrate de que la ruta sea correcta según tus carpetas

// Importamos todas las pantallas nuevas
import Prestadores from './Prestadores';
import RegistrarUsuario from './RegistrarUsuario';
import Bitacora from './Bitacora';
import Asistencia from './Asistencia';
import Evidencias from './Evidencias';
import Reportes from './Reportes'; // Asumiendo que guardaste uno similar a Evidencias para los reportes
import MiEstado from './MiEstado';
import EstadoPrestadores from './EstadoPrestadores';

const GUINDA_IPN = '#750946';

const Dashboard = ({ role, onLogout }) => {
  // Este estado controlará a qué sección entramos. Si es 'null', vemos el menú principal.
  const [activeView, setActiveView] = useState(null);

  // 1. Aquí actualizamos el menú del Prestador quitando "Mis Reportes" y "Material UDI"
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

  const currentMenu = menus[role] || [];

  // Función para renderizar el componente correcto según el botón presionado
  const renderActiveView = () => {
    switch (activeView) {
      case 'Prestadores':
        return <Prestadores />;
      case 'Registrar Nuevo Usuario':
        return <RegistrarUsuario />;
      case 'Bitácora':
        return <Bitacora />;
      case 'Asistencia':
        return <Asistencia />;
      case 'Evidencias':
        return <Evidencias />;
      case 'Reportes':
        return <Reportes />;
      case 'Mi Estado':
      case 'Mi estado': // Cubrimos ambas formas de escribirlo según tu menú
        return <MiEstado />;
      case 'Estado Prestadores':
        return <EstadoPrestadores />;
      default:
        return <p>Pantalla no encontrada o en construcción.</p>;
    }
  };

  // --- LÓGICA DE NAVEGACIÓN (CONTINUIDAD) ---
  // Si el usuario ya seleccionó una vista (ej. "Bitácora"), le mostramos esa pantalla
  if (activeView) {
    return (
      <div style={{ backgroundColor: '#f9f9f9', minHeight: '100vh', fontFamily: 'Montserrat, sans-serif' }}>
        <Header />
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
          
          {/* Botón para regresar al menú de botones */}
          <button 
            onClick={() => setActiveView(null)}
            style={{ marginBottom: '20px', padding: '8px 15px', backgroundColor: '#636569', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            ← Regresar al Tablero
          </button>

          {/* Aquí insertamos el componente dinámico */}
          <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', border: `2px solid ${GUINDA_IPN}`, textAlign: 'center' }}>
            {renderActiveView()}
          </div>

        </div>
      </div>
    );
  }

  // --- VISTA DEL MENÚ PRINCIPAL ---
  // Si no ha seleccionado nada (activeView es null), mostramos los botones
  return (
    <div style={{ backgroundColor: '#f9f9f9', minHeight: '100vh', fontFamily: 'Montserrat, sans-serif' }}>
      <Header />
      <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ color: GUINDA_IPN }}>Tablero: {role}</h2>
          <button onClick={onLogout} style={{ padding: '8px 16px', backgroundColor: '#636569', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Salir</button>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px', 
          justifyContent: 'center' 
        }}>
          {currentMenu.map((btnName, index) => (
            <button 
              key={index} 
              // 2. Al dar clic, cambiamos el estado para que cargue la nueva pantalla
              onClick={() => setActiveView(btnName)}
              style={{
                padding: '20px', backgroundColor: 'white', border: `2px solid ${GUINDA_IPN}`,
                color: GUINDA_IPN, fontWeight: 'bold', fontSize: '1rem', borderRadius: '8px',
                cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: '0.3s',
                gridColumn: btnName === "Reportes" ? '1 / -1' : 'auto'
              }}
              onMouseOver={(e) => { e.target.style.backgroundColor = GUINDA_IPN; e.target.style.color = 'white'; }}
              onMouseOut={(e) => { e.target.style.backgroundColor = 'white'; e.target.style.color = GUINDA_IPN; }}
            >
              {btnName}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;