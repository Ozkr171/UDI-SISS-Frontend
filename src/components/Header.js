import React from 'react';

const Header = () => (
  <header style={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    padding: '1rem', 
    backgroundColor: '#6A1B31', // Color Guinda IPN
    color: 'white',            // Texto en Blanco
    borderBottom: '2px solid #521426' 
  }}>
    <h1 style={{ fontWeight: 'bold', margin: 0 }}>UDI-SISS</h1>
    <span style={{ fontWeight: 'bold' }}>SUSS</span>
  </header>
);

export default Header;