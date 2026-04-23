import React, { useState } from 'react';

const RoleSelectionScreen = () => {
  const [selectedRole, setSelectedRole] = useState("");
  const roles = ["Jefe de UDI", "Empleado de UDI", "Prestador de Servicio"];

  return (
    <div style={{ textAlign: 'center', marginTop: '2rem', fontFamily: 'sans-serif' }}>
      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>Identificación</h2>
      
      <div style={{ 
        display: 'inline-block', 
        border: '2px solid #ccc', 
        padding: '2rem', 
        borderRadius: '10px', 
        backgroundColor: 'white',
        textAlign: 'left'
      }}>
        {roles.map((role) => (
          <div key={role} style={{ marginBottom: '1rem' }}>
            <label style={{ cursor: 'pointer', fontSize: '1.1rem' }}>
              <input 
                type="radio" 
                name="role" 
                value={role}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{ marginRight: '10px' }}
              />
              {role}
            </label>
          </div>
        ))}
      </div>

      <br />
      <button 
        style={{ 
          marginTop: '2rem', 
          padding: '10px 40px', 
          border: '2px solid black', 
          borderRadius: '5px',
          backgroundColor: selectedRole ? 'black' : 'white',
          color: selectedRole ? 'white' : 'black',
          fontWeight: 'bold',
          cursor: selectedRole ? 'pointer' : 'not-allowed',
          transition: '0.3s'
        }}
        disabled={!selectedRole}
      >
        Ingresar
      </button>
    </div>
  );
};

export default RoleSelectionScreen; 