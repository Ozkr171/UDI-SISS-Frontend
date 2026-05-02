import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

const GUINDA_IPN = '#750946';

const TrabajosEspeciales = () => {
  const rolUsuario = localStorage.getItem('userRole') || 'Prestador de Servicio';
  const nombreUsuario = localStorage.getItem('userName') || 'Usuario';

  const [trabajos, setTrabajos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // --- Estados Modales ---
  const [trabajoSeleccionado, setTrabajoSeleccionado] = useState(null);
  
  // Modal: Asignar Trabajo (Jefe)
  const [showModalAsignar, setShowModalAsignar] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [horas, setHoras] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');
  const [comentarioRechazoSolicitud, setComentarioRechazoSolicitud] = useState('');

  // Modal: Entregar Trabajo (Prestador)
  const [showModalEntregar, setShowModalEntregar] = useState(false);
  const [archivo, setArchivo] = useState(null);

  // Modal: Evaluar Entrega (Jefe)
  const [showModalEvaluar, setShowModalEvaluar] = useState(false);
  const [estadoEvaluacion, setEstadoEvaluacion] = useState('Aprobado');
  const [comentarioEvaluacion, setComentarioEvaluacion] = useState('');

  const cargarTrabajos = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/trabajos/${rolUsuario}/${nombreUsuario}`);
      const data = await res.json();
      setTrabajos(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Error al cargar los trabajos especiales.");
    }
  }, [rolUsuario, nombreUsuario]);

  useEffect(() => {
    cargarTrabajos();
  }, [cargarTrabajos]);

  // ==========================================
  // ACCIONES DEL PRESTADOR
  // ==========================================
  const solicitarTrabajo = async () => {
    if (!window.confirm("¿Seguro que quieres solicitar un trabajo especial para sumar horas?")) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/trabajos/solicitar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prestador_solicitante: nombreUsuario })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message);
        cargarTrabajos();
      } else toast.error("Error al solicitar.");
    } catch (err) { toast.error("Error de red."); }
    setIsLoading(false);
  };

  const entregarTrabajo = async (e) => {
    e.preventDefault();
    if (!archivo) return toast.warning("Debes seleccionar un archivo para entregar.");
    
    setIsLoading(true);
    const formData = new FormData();
    formData.append('archivo', archivo);

    try {
      const res = await fetch(`http://localhost:5000/api/trabajos/${trabajoSeleccionado.id}/entregar`, {
        method: 'PUT',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message);
        setShowModalEntregar(false);
        setArchivo(null);
        setTrabajoSeleccionado(null);
        cargarTrabajos();
      } else toast.error("Error al entregar.");
    } catch (err) { toast.error("Error de red."); }
    setIsLoading(false);
  };

  // ==========================================
  // ACCIONES DEL JEFE
  // ==========================================
  const procesarSolicitud = async (accion) => {
    if (accion === 'Rechazado' && !comentarioRechazoSolicitud.trim()) {
      return toast.warning("Debes dar un motivo para rechazar la solicitud.");
    }
    if (accion === 'Asignado') {
      if (!titulo || !descripcion || !horas || !fechaEntrega) return toast.warning("Debes llenar todos los datos para asignar el trabajo.");
    }

    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/trabajos/${trabajoSeleccionado.id}/asignar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: accion,
          titulo, descripcion, horas_a_sumar: horas, fecha_entrega: fechaEntrega,
          comentario_jefe: comentarioRechazoSolicitud,
          prestador_solicitante: trabajoSeleccionado.prestador_solicitante
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message);
        setShowModalAsignar(false);
        setTrabajoSeleccionado(null);
        setTitulo(''); setDescripcion(''); setHoras(''); setFechaEntrega(''); setComentarioRechazoSolicitud('');
        cargarTrabajos();
      } else toast.error("Error al procesar.");
    } catch (err) { toast.error("Error de red."); }
    setIsLoading(false);
  };

  const evaluarEntrega = async () => {
    if (estadoEvaluacion === 'Rechazado' && !comentarioEvaluacion.trim()) {
      return toast.warning("Debes explicar por qué rechazas la entrega.");
    }

    setIsLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/trabajos/${trabajoSeleccionado.id}/evaluar`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estado: estadoEvaluacion,
          comentario_jefe: comentarioEvaluacion,
          horas_a_sumar: trabajoSeleccionado.horas_a_sumar,
          prestador_solicitante: trabajoSeleccionado.prestador_solicitante
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message);
        setShowModalEvaluar(false);
        setTrabajoSeleccionado(null);
        setComentarioEvaluacion('');
        cargarTrabajos();
      } else toast.error("Error al evaluar.");
    } catch (err) { toast.error("Error de red."); }
    setIsLoading(false);
  };

  // --- HELPERS VISUALES ---
  const getBadgeStyle = (estado) => {
    switch(estado) {
      case 'Solicitado': return { bg: '#e3f2fd', color: '#1976d2' };
      case 'Asignado': return { bg: '#fff3e0', color: '#e65100' };
      case 'Entregado': return { bg: '#f3e5f5', color: '#7b1fa2' };
      case 'Aprobado': return { bg: '#e8f5e9', color: '#2e7d32' };
      case 'Rechazado': return { bg: '#ffebee', color: '#d32f2f' };
      default: return { bg: '#eee', color: '#333' };
    }
  };

  return (
    <div style={{ textAlign: 'left', position: 'relative' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: GUINDA_IPN, margin: 0 }}>Gestión de Trabajos Especiales</h3>
        {rolUsuario === 'Prestador de Servicio' && (
          <button 
            onClick={solicitarTrabajo} disabled={isLoading}
            style={{ backgroundColor: GUINDA_IPN, color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
          >
            + Solicitar Trabajo para Sumar Horas
          </button>
        )}
      </div>

      {/* GRID DE TRABAJOS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
        {trabajos.length > 0 ? trabajos.map((trab) => {
          const badge = getBadgeStyle(trab.estado);
          return (
            <div key={trab.id} style={{ border: '1px solid #e0e0e0', borderRadius: '10px', padding: '20px', backgroundColor: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', position: 'relative' }}>
              
              <div style={{ position: 'absolute', top: '15px', right: '15px', fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '12px', backgroundColor: badge.bg, color: badge.color }}>
                {trab.estado}
              </div>

              <h4 style={{ margin: '0 0 5px 0', color: '#333', paddingRight: '80px' }}>{trab.titulo || 'Solicitud Pendiente'}</h4>
              <p style={{ margin: '0 0 15px 0', fontSize: '0.85rem', color: '#666' }}>De: <b>{trab.prestador_solicitante}</b></p>
              
              {trab.descripcion && (
                <div style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '15px', color: '#444' }}>
                  {trab.descripcion}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.8rem', marginBottom: '15px' }}>
                {trab.horas_a_sumar && <div><strong>Horas a ganar:</strong> <br/><span style={{ color: 'green', fontSize: '1rem', fontWeight: 'bold' }}>+{trab.horas_a_sumar}h</span></div>}
                {trab.fecha_entrega && <div><strong>Fecha Límite:</strong> <br/>{new Date(trab.fecha_entrega).toLocaleDateString()}</div>}
              </div>

              {trab.comentario_jefe && (
                <div style={{ fontSize: '0.8rem', color: trab.estado === 'Rechazado' ? '#d32f2f' : '#0055a4', borderLeft: `3px solid ${trab.estado === 'Rechazado' ? '#d32f2f' : '#0055a4'}`, paddingLeft: '8px', marginBottom: '15px' }}>
                  <strong>Nota del Jefe:</strong> {trab.comentario_jefe}
                </div>
              )}

              {/* CONTROLES DINÁMICOS SEGÚN ESTADO Y ROL */}
              {rolUsuario === 'Jefe de UDI' && trab.estado === 'Solicitado' && (
                <button onClick={() => { setTrabajoSeleccionado(trab); setShowModalAsignar(true); }} style={{ width: '100%', padding: '8px', backgroundColor: '#0055a4', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Evaluar Solicitud</button>
              )}

              {rolUsuario === 'Prestador de Servicio' && trab.estado === 'Asignado' && (
                <button onClick={() => { setTrabajoSeleccionado(trab); setShowModalEntregar(true); }} style={{ width: '100%', padding: '8px', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Subir Entrega</button>
              )}

              {rolUsuario === 'Jefe de UDI' && trab.estado === 'Entregado' && (
                <button onClick={() => { setTrabajoSeleccionado(trab); setShowModalEvaluar(true); }} style={{ width: '100%', padding: '8px', backgroundColor: '#7b1fa2', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Calificar Entrega</button>
              )}

              {/* Botón de descarga si ya hay archivo */}
              {trab.archivo_trabajo && (
                 <a href={`http://localhost:5000/uploads/${trab.archivo_trabajo}`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', marginTop: '10px', padding: '8px', backgroundColor: '#eef2f5', color: '#333', textDecoration: 'none', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold', border: '1px solid #ccc' }}>
                   ⬇️ Descargar Archivo Entregado
                 </a>
              )}

            </div>
          );
        }) : (
          <p style={{ color: '#666', gridColumn: '1 / -1', textAlign: 'center', padding: '40px', backgroundColor: '#fcfcfc', border: '1px dashed #ccc', borderRadius: '8px' }}>
            No hay trabajos especiales registrados.
          </p>
        )}
      </div>

      {/* ========================================== */}
      {/* MODAL: ASIGNAR TRABAJO (Jefe) */}
      {/* ========================================== */}
      {showModalAsignar && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '90%', maxWidth: '500px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, color: GUINDA_IPN, borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Asignar Trabajo Especial</h3>
            <p style={{ fontSize: '0.85rem', color: '#555' }}>El prestador <b>{trabajoSeleccionado?.prestador_solicitante}</b> quiere sumar horas. ¿Qué le vas a poner a hacer?</p>
            
            <div style={{ marginBottom: '10px' }}><label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Título del Proyecto:</label><input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} placeholder="Ej. Inventario de Cables UTP" /></div>
            
            <div style={{ marginBottom: '10px' }}><label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Descripción detallada:</label><textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} rows="3" style={{ width: '100%', padding: '8px', boxSizing: 'border-box', resize: 'none' }} placeholder="Instrucciones del trabajo..." /></div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
              <div><label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Horas de premio:</label><input type="number" step="0.5" min="0" value={horas} onChange={e => setHoras(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} placeholder="Ej. 10" /></div>
              <div><label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Fecha límite:</label><input type="date" value={fechaEntrega} onChange={e => setFechaEntrega(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }} /></div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
              <div style={{ display: 'flex', gap: '5px', flex: 1 }}>
                <input type="text" value={comentarioRechazoSolicitud} onChange={e => setComentarioRechazoSolicitud(e.target.value)} placeholder="Motivo si vas a rechazar..." style={{ padding: '8px', width: '60%', fontSize: '0.8rem', border: '1px solid #ccc', borderRadius: '4px' }} />
                <button onClick={() => procesarSolicitud('Rechazado')} disabled={isLoading} style={{ padding: '8px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>Rechazar</button>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setShowModalAsignar(false)} style={{ padding: '8px 15px', backgroundColor: '#e0e0e0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                <button onClick={() => procesarSolicitud('Asignado')} disabled={isLoading} style={{ padding: '8px 15px', backgroundColor: '#0055a4', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Asignar Tarea</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: ENTREGAR TRABAJO (Prestador) */}
      {/* ========================================== */}
      {showModalEntregar && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, color: '#ff9800', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Subir Entrega</h3>
            <p style={{ fontSize: '0.85rem', color: '#555' }}>Estás entregando: <b>{trabajoSeleccionado?.titulo}</b></p>
            
            <form onSubmit={entregarTrabajo}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Seleccionar Archivo (PDF, Word, Excel):</label>
                <input type="file" onChange={(e) => setArchivo(e.target.files[0])} accept=".pdf,.docx,.xlsx" style={{ width: '100%', padding: '8px', boxSizing: 'border-box', marginTop: '5px' }} required />
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setShowModalEntregar(false)} style={{ padding: '8px 15px', backgroundColor: '#e0e0e0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
                <button type="submit" disabled={isLoading} style={{ padding: '8px 15px', backgroundColor: '#ff9800', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{isLoading ? 'Subiendo...' : 'Entregar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* MODAL: EVALUAR ENTREGA (Jefe) */}
      {/* ========================================== */}
      {showModalEvaluar && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '90%', maxWidth: '400px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, color: '#7b1fa2', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>Calificar Entrega</h3>
            <p style={{ fontSize: '0.85rem', color: '#555' }}>Si apruebas, el sistema sumará automáticamente <b>{trabajoSeleccionado?.horas_a_sumar} horas</b> a {trabajoSeleccionado?.prestador_solicitante}.</p>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Decisión:</label>
              <select value={estadoEvaluacion} onChange={(e) => setEstadoEvaluacion(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing:'border-box', border: '1px solid #ccc', borderRadius: '4px' }}>
                <option value="Aprobado">✅ Aprobar y Sumar Horas</option>
                <option value="Rechazado">❌ Rechazar Entrega</option>
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontWeight: 'bold', fontSize: '0.85rem' }}>Comentarios o retroalimentación:</label>
              <textarea value={comentarioEvaluacion} onChange={(e) => setComentarioEvaluacion(e.target.value)} rows="3" style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box', resize: 'none' }} placeholder={estadoEvaluacion === 'Rechazado' ? "Motivo obligatorio del rechazo..." : "¡Buen trabajo! (Opcional)"} />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowModalEvaluar(false)} style={{ padding: '8px 15px', backgroundColor: '#e0e0e0', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Cancelar</button>
              <button onClick={evaluarEntrega} disabled={isLoading} style={{ padding: '8px 15px', backgroundColor: estadoEvaluacion === 'Aprobado' ? '#2e7d32' : '#d32f2f', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>{isLoading ? 'Procesando...' : 'Confirmar'}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TrabajosEspeciales;