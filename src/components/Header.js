import React from 'react';

const Header = () => {
  const GUINDA_IPN = '#750946';

  return (
    <header style={{ 
      backgroundColor: GUINDA_IPN, 
      color: 'white', 
      padding: '15px 20px', 
      textAlign: 'center',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
    }}>
      {/* EL CAMBIO MAESTRO AQUÍ */}
      <h1 style={{ margin: 0, fontSize: '1.5rem', letterSpacing: '1px' }}>
        SIGESS-UDI
      </h1>
      <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', opacity: 0.9 }}>
        Sistema Integral de Gestión de Servicio Social
      </p>
    </header>
  );
};

export default Header;