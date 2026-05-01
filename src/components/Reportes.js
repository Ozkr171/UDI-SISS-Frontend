import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

const GUINDA_IPN = '#750946';

const Reportes = () => {
  const [archivo, setArchivo] = useState(null);
  const [mes, setMes] = useState('Marzo 2026');
  const [reportesSubidos, setReportesSubidos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  const [showModal, setShowModal] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [reporteARechazar, setReporteARechazar] = useState(null);

  const nombreUsuario = localStorage.getItem('userName');
  const rolUsuario = localStorage.getItem('userRole');

  const cargarReportes = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = rolUsuario === 'Jefe de UDI' 
        ? `http://localhost:5000/api/reportes-global` 
        : `http://localhost:5000/api/reportes/${nombreUsuario}`;

      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReportesSubidos(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorMsg("Error al conectar con el servidor de reportes.");
    } finally {
      setIsLoading(false);
    }
  }, [nombreUsuario, rolUsuario]);

  useEffect(() => {
    cargarReportes();
  }, [cargarReportes]);

  const handleSubir = async (e) => {
    e.preventDefault();
    if (!archivo) return toast.warning("Selecciona un archivo PDF primero.");
    
    // VALIDACIÓN DE PESO (Máximo 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (archivo.size > MAX_FILE_SIZE) {
      return toast.warning("El archivo PDF es demasiado grande. Máximo 5MB.");
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('usuario_nombre', nombreUsuario);
    formData.append('mes', mes);

    try {
      const respuesta = await fetch('http://localhost:5000/api/reportes', {
        method: 'POST',
        body: formData
      });
      
      const data = await respuesta.json();

      if (respuesta.ok && data.success) {
        toast.success(data.message);
        setArchivo(null);
        e.target.reset();
        cargarReportes();
      } else {
        toast.error(`Error: ${data.message}`);
      }
    } catch (error) {
      toast.error("Error de comunicación: El servidor no respondió.");
    } finally {
      setIsLoading(false);
    }
  };

  const validarReporte = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/reportes/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevoEstado: 'Validado', comentario: '' })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success("Reporte validado exitosamente.");
        cargarReportes(); 
      }
    } catch (error) {
      toast.error("Error de red al intentar actualizar el estado.");
    }
  };

  const abrirModalRechazo = (id) => {
    setReporteARechazar(id);
    setMotivoRechazo('');
    setShowModal(true);
  };

  const confirmarRechazo = async () => {
    if (motivoRechazo.trim() === '') {
      return toast.warning("Debes escribir un motivo para poder rechazar el reporte.");
    }

    try {
      const res = await fetch(`http://localhost:5000/api/reportes/${reporteARechazar}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevoEstado: 'Rechazado', comentario: motivoRechazo }) 
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success("Reporte rechazado. Se notificará al prestador.");
        setShowModal(false); 
        cargarReportes(); 
      } else {
        toast.error("Error al actualizar el estado: " + data.message);
      }
    } catch (error) {
      toast.error("Error de red al intentar actualizar el estado.");
    }
  };

  return (
    <div style={{ textAlign: 'left', position: 'relative' }}>
      <h3 style={{ color: GUINDA_IPN }}>Reportes Mensuales (PDF)</h3>
      
      {errorMsg && <div style={{ color: 'red', marginBottom: '10px' }}>{errorMsg}</div>}

      {rolUsuario !== 'Jefe de UDI' && (
        <div style={{ marginBottom: '40px', border: '1px solid #ccc', padding: '20px', borderRadius: '8px', backgroundColor: '#fdfdfd' }}>
          <form onSubmit={handleSubir}>
            <label>Mes a reportar:</label>
            <input type="text" value={mes} onChange={(e) => setMes(e.target.value)} style={{ display: 'block', margin: '10px 0', padding: '8px', width: '100%', boxSizing: 'border-box' }} required />

            <label>Seleccionar PDF (Máx. 5MB):</label>
            <input type="file" accept=".pdf" onChange={(e) => setArchivo(e.target.files[0])} style={{ display: 'block', margin: '10px 0 20px 0' }} required />
            
            <button type="submit" disabled={isLoading} style={{ padding: '10px 20px', backgroundColor: GUINDA_IPN, color: 'white', border: 'none', borderRadius: '4px', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
              {isLoading ? 'Subiendo...' : 'Subir Reporte'}
            </button>
          </form>
        </div>
      )}

      <h4>Historial de Reportes</h4>
      <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
          <thead>
            <tr style={{ backgroundColor: '#636569', color: 'white', textAlign: 'left' }}>
              {rolUsuario === 'Jefe de UDI' && <th style={{ padding: '12px' }}>Prestador</th>}
              <th style={{ padding: '12px' }}>Mes</th>
              <th style={{ padding: '12px' }}>Archivo PDF</th>
              <th style={{ padding: '12px' }}>Fecha de Subida</th>
              <th style={{ padding: '12px', width: '25%' }}>Estado</th>
              {rolUsuario === 'Jefe de UDI' && <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {Array.isArray(reportesSubidos) && reportesSubidos.map((rep) => (
              <tr key={rep.id} style={{ borderBottom: '1px solid #eee' }}>
                
                {rolUsuario === 'Jefe de UDI' && (
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{rep.usuario_nombre}</td>
                )}

                <td style={{ padding: '12px' }}>{rep.mes}</td>
                
                <td style={{ padding: '12px' }}>
                  <a href={`http://localhost:5000/uploads/${rep.nombre_archivo}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc', textDecoration: 'none', fontWeight: 'bold' }}>
                    📄 Ver Archivo
                  </a>
                </td>
                
                <td style={{ padding: '12px' }}>{new Date(rep.fecha_subida).toLocaleDateString()}</td>
                
                <td style={{ padding: '12px' }}>
                  <span style={{ fontWeight: 'bold', color: rep.estado === 'Validado' ? 'green' : rep.estado === 'Rechazado' ? '#d32f2f' : '#ff9800' }}>
                    {rep.estado || 'En proceso de validación'} 
                  </span>
                  
                  {rep.estado === 'Rechazado' && rep.comentario_jefe && (
                    <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#555', backgroundColor: '#ffeaea', padding: '5px', borderRadius: '4px', borderLeft: '3px solid #d32f2f' }}>
                      <strong>Motivo:</strong> {rep.comentario_jefe}
                    </div>
                  )}
                </td>

                {rolUsuario === 'Jefe de UDI' && (
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {rep.estado === 'En proceso de validación' ? (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => validarReporte(rep.id)} style={{ backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}>
                          ✓
                        </button>
                        <button onClick={() => abrirModalRechazo(rep.id)} style={{ backgroundColor: '#f44336', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }} title="Rechazar y comentar">
                          ✗
                        </button>
                      </div>
                    ) : rep.estado === 'Validado' ? (
                      <span style={{ color: 'green', fontWeight: 'bold' }}>Aprobado</span>
                    ) : (
                      <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>Rechazado</span>
                    )}
                  </td>
                )}
              </tr>
            ))}
            
            {reportesSubidos.length === 0 && (
              <tr>
                <td colSpan={rolUsuario === 'Jefe de UDI' ? "6" : "4"} style={{ textAlign: 'center', padding: '20px' }}>
                  No hay reportes registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '400px', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>
            <h3 style={{ color: '#d32f2f', marginTop: 0 }}>Rechazar Reporte</h3>
            <p style={{ fontSize: '0.9rem', color: '#555' }}>Por favor, indica el motivo del rechazo para que el prestador pueda corregirlo:</p>
            
            <textarea 
              value={motivoRechazo} 
              onChange={(e) => setMotivoRechazo(e.target.value)} 
              rows="4" 
              style={{ width: '100%', padding: '10px', boxSizing: 'border-box', marginTop: '10px', border: '1px solid #ccc', borderRadius: '4px', resize: 'none' }}
              placeholder="Ej. Faltan las firmas en la página 2..."
            />
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setShowModal(false)} style={{ padding: '8px 15px', backgroundColor: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={confirmarRechazo} style={{ padding: '8px 15px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Reportes;