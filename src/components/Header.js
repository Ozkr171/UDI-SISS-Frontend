import React from 'react';

const GUINDA_IPN = '#750946';

const Header = () => {
  return (
    <header style={{ 
      backgroundColor: 'rgba(255, 255, 255, 0.95)', // Un blanco tantito transparente para que luzca moderno
      padding: '10px 30px', 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      borderBottom: `4px solid ${GUINDA_IPN}`,
      boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
      position: 'sticky',
      top: 0,
      zIndex: 1000
    }}>
      
      {/* Escudo Izquierdo (IPN) */}
      <img 
        src="/logo-ipn.png" 
        alt="Escudo IPN" 
        style={{ height: '70px', objectFit: 'contain' }} 
        onError={(e) => e.target.style.display = 'none'} // Si no encuentra la imagen, la oculta para no romper el diseño
      />
      
      {/* Textos Centrales */}
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ margin: 0, color: GUINDA_IPN, fontSize: '2rem', letterSpacing: '1px', textShadow: '1px 1px 2px rgba(0,0,0,0.1)' }}>
          SIGESS-UDI
        </h1>
        <p style={{ margin: '5px 0 0 0', color: '#555', fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase' }}>
          CECyT 5 "Benito Juárez"
        </p>
      </div>

      {/* Escudo Derecho (CECyT 5) */}
      <img 
        src="/logo-cecyt5.png" 
        alt="Escudo CECyT 5" 
        style={{ height: '70px', objectFit: 'contain' }} 
        onError={(e) => e.target.style.display = 'none'}
      />

    </header>
  );
};

export default Header;