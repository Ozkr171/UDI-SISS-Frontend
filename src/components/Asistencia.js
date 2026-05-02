import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

const GUINDA_IPN = '#750946';

const Asistencia = () => {
  const nombreUsuario = localStorage.getItem('userName');
  const rolUsuario = localStorage.getItem('userRole');

  const hoy = new Date().toISOString().split('T')[0];
  const [fechaSeleccionada, setFechaSeleccionada] = useState(hoy);
  
  const [registros, setRegistros] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const cargarDatos = useCallback(async () => {
    setIsLoading(true);
    try {
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

  const calcularHoras = (entrada, salida) => {
    if (!entrada || !salida) return '--';
    
    const [hE, mE] = entrada.split(':').map(Number);
    const [hS, mS] = salida.split(':').map(Number);
    
    let minE = hE * 60 + mE;
    let minS = hS * 60 + mS;
    let diff = minS - minE;
    
    if (diff < 0) return 'Error'; 
    
    const horas = Math.floor(diff / 60);
    const mins = diff % 60;
    return `${horas}h ${mins}m`;
  };

  // --- NUEVA FUNCIÓN: Blindaje de Fechas ---
  const formatearFecha = (fechaBD) => {
    if (!fechaBD) return '--/--/----';
    try {
      // Extraemos exactamente "YYYY-MM-DD"
      const soloFecha = fechaBD.toString().substring(0, 10);
      const [year, month, day] = soloFecha.split('-');
      return `${day}/${month}/${year}`;
    } catch (e) {
      return 'Fecha Inválida';
    }
  };

  const marcarAsistencia = async (nombrePrestador, tipoAccion) => {
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
        toast.success(`Asistencia (${tipoAccion}) registrada para ${nombrePrestador}`);
        cargarDatos(); 
      } else {
        toast.error("Error al registrar la asistencia.");
      }
    } catch (error) {
      toast.error("Error de red.");
    }
  };

  if (rolUsuario === 'Jefe de UDI') {
    return (
      <div style={{ textAlign: 'left' }}>
        <h3 style={{ color: GUINDA_IPN }}>Control Diario de Asistencia</h3>
        
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

        <div style={{ overflowX: 'auto', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '600px' }}>
            <thead>
              <tr style={{ backgroundColor: '#636569', color: 'white', textAlign: 'left' }}>
                <th style={{ padding: '12px' }}>Prestador</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Entrada</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Salida</th>
                <th style={{ padding: '12px', textAlign: 'center' }}>Total Horas</th>
              </tr>
            </thead>
            <tbody>
              {registros.length > 0 ? (
                registros.map((reg, index) => (
                  <tr key={index} style={{ borderBottom: '1px solid #eee', backgroundColor: reg.estado === 'Falta' ? '#ffeaea' : 'white' }}>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{reg.usuario_nombre}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
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
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      {reg.estado === 'Falta' ? (
                        <span style={{ color: 'red' }}>Falta</span>
                      ) : reg.hora_salida ? (
                        <span style={{ color: '#0055a4', fontWeight: 'bold' }}>{reg.hora_salida}</span>
                      ) : (
                        <button 
                          onClick={() => marcarAsistencia(reg.usuario_nombre, 'Salida')} 
                          disabled={!reg.hora_entrada}
                          style={{ backgroundColor: reg.hora_entrada ? '#f44336' : '#ccc', color: 'white', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: reg.hora_entrada ? 'pointer' : 'not-allowed' }}
                        >
                          Marcar Salida
                        </button>
                      )}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                      {reg.estado === 'Falta' ? (
                        <span style={{ color: 'red' }}>Inasistencia</span>
                      ) : (
                        calcularHoras(reg.hora_entrada, reg.hora_salida)
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', backgroundColor: 'white' }}>No hay prestadores registrados en el sistema.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div style={{ textAlign: 'left' }}>
      <h3 style={{ color: GUINDA_IPN }}>Mi Historial de Asistencia</h3>
      
      {errorMsg && <div style={{ color: 'red', marginBottom: '10px' }}>{errorMsg}</div>}

      <div style={{ overflowX: 'auto', marginTop: '15px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
          <thead>
            <tr style={{ backgroundColor: '#636569', color: 'white', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Fecha</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Hora Entrada</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Hora Salida</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>Horas Hechas</th>
            </tr>
          </thead>
          <tbody>
            {registros.length > 0 ? (
              registros.map((reg, index) => (
                <tr key={index} style={{ borderBottom: '1px solid #eee', backgroundColor: reg.estado === 'Falta' ? '#ffeaea' : 'white' }}>
                  {/* AQUÍ APLICAMOS LA FUNCIÓN DE FORMATO */}
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{formatearFecha(reg.fecha)}</td>
                  
                  {reg.estado === 'Falta' ? (
                    <>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#666' }}>--</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#666' }}>--</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: 'red', fontWeight: 'bold' }}>Inasistencia</td>
                    </>
                  ) : (
                    <>
                      <td style={{ padding: '12px', textAlign: 'center', color: 'green' }}>{reg.hora_entrada || '--:--:--'}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#0055a4' }}>{reg.hora_salida || 'Pendiente...'}</td>
                      <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                        {calcularHoras(reg.hora_entrada, reg.hora_salida)}
                      </td>
                    </>
                  )}
                </tr>
              ))
            ) : (
              <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', backgroundColor: 'white' }}>No tienes registros de asistencia aún.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Asistencia;