import React, { useState, useEffect, useCallback } from 'react';

const GUINDA_IPN = '#750946';

const Asistencia = () => {
  const nombreUsuario = localStorage.getItem('userName');
  const rolUsuario = localStorage.getItem('userRole');

  // Estado para la fecha que está viendo el Jefe (por defecto, HOY)
  const hoy = new Date().toISOString().split('T')[0];
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy);
  
  const [registros, setRegistros] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const cargarDatos = useCallback(async () => {
    setIsLoading(true);
    try {
      // El jefe pide los datos del día seleccionado, el prestador pide su historial completo
      const url = rolUsuario === 'Jefe de UDI' 
        ? `http://localhost:5000/api/asistencia/dia/${fechaSeleccionada}` 
        : `http://localhost:5000/api/asistencia/historial/${nombreUsuario}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRegistros(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMsg("Error al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  }, [nombreUsuario, rolUsuario, fechaSeleccionada]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Función matemática para calcular diferencia de horas
  const calcularHoras = (entrada, salida) => {
    if (!entrada || !salida) return '--';
    
    const [hE, mE] = entrada.split(':').map(Number);
    const [hS, mS] = salida.split(':').map(Number);
    
    let minE = hE * 60 + mE;
    let minS = hS * 60 + mS;
    let diff = minS - minE;
    
    if (diff < 0) return 'Error'; // Por si salen antes de entrar (error humano)
    
    const horas = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${horas}h ${mins}m`;
  };

  // Acción del Jefe para registrar botones
  const marcarAsistencia = async (nombrePrestador, tipoAccion) => {
    // Tomamos la hora actual exacta del sistema del Jefe
    const horaActual = new Date().toLocaleTimeString('en-GB', { hour12: false }); 

    try {
      const res = await fetch('http://localhost:5000/api/asistencia/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_nombre: nombrePrestador,
          fecha: fechaSeleccionada,
          tipo: tipoAccion,
          hora: horaActual
        })
      });
      const data = await res.json();
      
      if (data.success) {
        cargarDatos(); // Recargamos para ver los cambios instantáneamente
      } else {
        alert("Error al registrar la asistencia.");
      }
    } catch (error) {
      alert("Error de red.");
    }
  };

  // ==========================================
  // VISTA DEL JEFE DE UDI
  // ==========================================
  if (rolUsuario === 'Jefe de UDI') {
    return (
      <div style={{ textAlign: 'left' }}>
        <h3 style={{ color: GUINDA_IPN }}>Control Diario de Asistencia</h3>
        
        {/* Control para cambiar de día */}
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px', border: '1px solid #ddd', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <label style={{ fontWeight: 'bold' }}>📅 Viendo registros del día:</label>
          <input 
            type="date" 
            value={fechaSeleccionada} 
            onChange={(e) => setFechaSeleccionada(e.target.value)} 
            style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
          {fechaSeleccionada === hoy && <span style={{ color: 'green', fontWeight: 'bold' }}>(Hoy)</span>}
        </div>

        {errorMsg && <div style={{ color: 'red', marginBottom: '10px' }}>{errorMsg}</div>}

        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr style={{ backgroundColor: '#636569', color: 'white', textAlign: 'left' }}>
              <th style={{ padding: '10px' }}>Prestador</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Entrada</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Salida</th>
              <th style={{ padding: '10px', textAlign: 'center' }}>Total Horas</th>
            </tr>
          </thead>
          <tbody>
            {registros.length > 0 ? (
              registros.map((reg, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #ccc', backgroundColor: reg.estado === 'Falta' ? '#ffeaea' : 'transparent' }}>
                  
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>{reg.usuario_nombre}</td>
                  
                  {/* Celda de Entrada */}
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    {reg.estado === 'Falta' ? (
                      <span style={{ color: 'red' }}>Falta</span>
                    ) : reg.hora_entrada ? (
                      <span style={{ color: 'green', fontWeight: 'bold' }}>{reg.hora_entrada}</span>
                    ) : (
                      <button onClick={() => marcarAsistencia(reg.usuario_nombre, 'Entrada')} style={{ backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>
                        Marcar Entrada
                      </button>
                    )}
                  </td>

                  {/* Celda de Salida */}
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    {reg.estado === 'Falta' ? (
                      <span style={{ color: 'red' }}>Falta</span>
                    ) : reg.hora_salida ? (
                      <span style={{ color: '#0055a4', fontWeight: 'bold' }}>{reg.hora_salida}</span>
                    ) : (
                      <button 
                        onClick={() => marcarAsistencia(reg.usuario_nombre, 'Salida')} 
                        disabled={!reg.hora_entrada} // No puede salir si no ha entrado
                        style={{ backgroundColor: reg.hora_entrada ? '#f44336' : '#ccc', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: reg.hora_entrada ? 'pointer' : 'not-allowed' }}
                      >
                        Marcar Salida
                      </button>
                    )}
                  </td>

                  {/* Celda de Horas Totales / Inasistencia */}
                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                    {reg.estado === 'Falta' ? (
                      <span style={{ color: 'red' }}>Inasistencia</span>
                    ) : (
                      calcularHoras(reg.hora_entrada, reg.hora_salida)
                    )}
                  </td>

                </tr>
              ))
            ) : (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No hay prestadores registrados en el sistema.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  // ==========================================
  // VISTA DEL PRESTADOR DE SERVICIO
  // ==========================================
  return (
    <div style={{ textAlign: 'left' }}>
      <h3 style={{ color: GUINDA_IPN }}>Mi Historial de Asistencia</h3>
      
      {errorMsg && <div style={{ color: 'red', marginBottom: '10px' }}>{errorMsg}</div>}

      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
        <thead>
          <tr style={{ backgroundColor: '#636569', color: 'white', textAlign: 'left' }}>
            <th style={{ padding: '10px' }}>Fecha</th>
            <th style={{ padding: '10px', textAlign: 'center' }}>Hora Entrada</th>
            <th style={{ padding: '10px', textAlign: 'center' }}>Hora Salida</th>
            <th style={{ padding: '10px', textAlign: 'center' }}>Horas Hechas</th>
          </tr>
        </thead>
        <tbody>
          {registros.length > 0 ? (
            registros.map((reg, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #ccc', backgroundColor: reg.estado === 'Falta' ? '#ffeaea' : 'transparent' }}>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>{new Date(reg.fecha + 'T00:00:00').toLocaleDateString()}</td>
                
                {reg.estado === 'Falta' ? (
                  <>
                    <td style={{ padding: '10px', textAlign: 'center', color: '#666' }}>--</td>
                    <td style={{ padding: '10px', textAlign: 'center', color: '#666' }}>--</td>
                    <td style={{ padding: '10px', textAlign: 'center', color: 'red', fontWeight: 'bold' }}>Inasistencia</td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: '10px', textAlign: 'center', color: 'green' }}>{reg.hora_entrada || '--:--:--'}</td>
                    <td style={{ padding: '10px', textAlign: 'center', color: '#0055a4' }}>{reg.hora_salida || 'Pendiente...'}</td>
                    <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                      {calcularHoras(reg.hora_entrada, reg.hora_salida)}
                    </td>
                  </>
                )}
              </tr>
            ))
          ) : (
            <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>No tienes registros de asistencia aún.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Asistencia;