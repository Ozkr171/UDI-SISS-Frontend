import React, { useState, useEffect } from 'react';

const GUINDA_IPN = '#750946';

const Prestadores = () => {
  const [prestadores, setPrestadores] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/prestadores')
      .then(res => res.json())
      .then(data => setPrestadores(data))
      .catch(err => console.error('Error al cargar prestadores:', err));
  }, []);

  return (
    <div style={{ textAlign: 'left' }}>
      <h3 style={{ color: GUINDA_IPN, borderBottom: `2px solid ${GUINDA_IPN}`, paddingBottom: '10px' }}>Listado de Prestadores</h3>
      
      <div style={{ overflowX: 'auto', marginTop: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px', backgroundColor: 'white' }}>
          <thead>
            <tr style={{ backgroundColor: '#636569', color: 'white' }}>
              <th style={{ padding: '12px' }}>Boleta</th>
              <th style={{ padding: '12px' }}>Nombre Completo</th>
              <th style={{ padding: '12px' }}>Correo</th>
              <th style={{ padding: '12px' }}>Horario</th>
            </tr>
          </thead>
          <tbody>
            {prestadores.map((p) => (
              <tr key={p.id} style={{ textAlign: 'center', borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '12px', fontWeight: 'bold' }}>{p.boleta}</td>
                <td style={{ padding: '12px' }}>{p.nombre}</td>
                <td style={{ padding: '12px', color: '#0055a4' }}>{p.correo}</td>
                <td style={{ padding: '12px' }}>{p.horario}</td>
              </tr>
            ))}
            {prestadores.length === 0 && (
              <tr>
                <td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>No hay prestadores registrados todavía.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Prestadores;