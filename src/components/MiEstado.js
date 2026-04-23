import React, { useState, useEffect } from 'react';

const GUINDA_IPN = '#750946';

const MiEstado = () => {
  const nombreUsuario = localStorage.getItem('userName');
  const [datos, setDatos] = useState({ horasEfectivas: 0, metaHoras: 480, reportesEntregados: 0 });

  useEffect(() => {
    fetch(`http://localhost:5000/api/mi-estado/${nombreUsuario}`)
      .then(res => res.json())
      .then(data => setDatos(data))
      .catch(err => console.error(err));
  }, [nombreUsuario]);

  const progreso = (datos.horasEfectivas / datos.metaHoras) * 100 || 0;

  return (
    <div style={{ textAlign: 'left', backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: `1px solid ${GUINDA_IPN}` }}>
      <h3 style={{ color: GUINDA_IPN, borderBottom: '2px solid #ccc', paddingBottom: '10px' }}>Mi Estado General</h3>
      
      <div style={{ fontSize: '1.1rem', lineHeight: '1.8' }}>
        <p><strong>Nombre Completo:</strong> {nombreUsuario}</p>
        <p><strong>Reportes Mensuales Entregados:</strong> {datos.reportesEntregados}</p>
        <p><strong>Horas Efectivas Realizadas:</strong> {datos.horasEfectivas} / {datos.metaHoras} hrs</p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>Progreso del Servicio:</p>
        <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '10px', height: '20px' }}>
          <div style={{ width: `${progreso > 100 ? 100 : progreso}%`, backgroundColor: '#4CAF50', height: '100%', borderRadius: '10px' }}></div>
        </div>
        <p style={{ textAlign: 'right', fontSize: '0.9rem', color: '#666' }}>{progreso.toFixed(1)}% completado</p>
      </div>
    </div>
  );
};

export default MiEstado;