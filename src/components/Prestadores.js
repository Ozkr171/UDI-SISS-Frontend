import React, { useState, useEffect } from 'react';

const GUINDA_IPN = '#750946';

const Prestadores = () => {
  const [prestadores, setPrestadores] = useState([]);

  useEffect(() => {
    // Pedimos la lista real al servidor al cargar la pantalla
    fetch('http://localhost:5000/api/prestadores')
      .then(res => res.json())
      .then(data => setPrestadores(data))
      .catch(err => console.error('Error al cargar prestadores:', err));
  }, []);

  return (
    <div style={{ textAlign: 'left' }}>
      <h3 style={{ color: GUINDA_IPN, borderBottom: `2px solid ${GUINDA_IPN}`, paddingBottom: '10px' }}>Listado de Prestadores</h3>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#636569', color: 'white' }}>
            <th style={{ padding: '10px', border: '1px solid #ccc' }}>Boleta</th>
            <th style={{ padding: '10px', border: '1px solid #ccc' }}>Nombre Completo</th>
            <th style={{ padding: '10px', border: '1px solid #ccc' }}>Correo</th>
            <th style={{ padding: '10px', border: '1px solid #ccc' }}>Horario</th>
          </tr>
        </thead>
        <tbody>
          {prestadores.map((p) => (
            <tr key={p.id} style={{ textAlign: 'center', backgroundColor: '#fcfcfc' }}>
              <td style={{ padding: '10px', border: '1px solid #ccc', fontWeight: 'bold' }}>{p.boleta}</td>
              <td style={{ padding: '10px', border: '1px solid #ccc' }}>{p.nombre}</td>
              <td style={{ padding: '10px', border: '1px solid #ccc' }}>{p.correo}</td>
              <td style={{ padding: '10px', border: '1px solid #ccc' }}>{p.horario}</td>
            </tr>
          ))}
          {prestadores.length === 0 && (
            <tr>
              <td colSpan="4" style={{ padding: '15px', textAlign: 'center' }}>No hay prestadores registrados todavía.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Prestadores;