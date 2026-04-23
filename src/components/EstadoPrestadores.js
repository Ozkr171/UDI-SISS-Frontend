import React, { useState, useEffect, useCallback } from 'react';

const GUINDA_IPN = '#750946';
const META_HORAS = 480;
const META_REPORTES = 7;

const EstadoPrestadores = () => {
  const nombreUsuario = localStorage.getItem('userName');
  const rolUsuario = localStorage.getItem('userRole');

  const [datos, setDatos] = useState(rolUsuario === 'Jefe de UDI' ? [] : null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // --- Estados para Modales del Jefe ---
  const [prestadorSeleccionado, setPrestadorSeleccionado] = useState(null);
  const [showModalBaja, setShowModalBaja] = useState(false);
  const [motivoBaja, setMotivoBaja] = useState('');

  const cargarDatos = useCallback(async () => {
    setIsLoading(true);
    try {
      const url = rolUsuario === 'Jefe de UDI' 
        ? 'http://localhost:5000/api/estado-prestadores' 
        : `http://localhost:5000/api/mi-estado/${nombreUsuario}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDatos(data);
    } catch (err) {
      setErrorMsg("Error de conexión al cargar el estado.");
    } finally {
      setIsLoading(false);
    }
  }, [nombreUsuario, rolUsuario]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Función para formatear las horas decimales a "X horas Y min"
  const formatoHoras = (horasDecimales) => {
    const h = Math.floor(horasDecimales);
    const m = Math.round((horasDecimales - h) * 60);
    return `${h}h ${m}m`;
  };

  // --- Funciones de Acción del Jefe ---
  const liberarServicio = async (id) => {
    if (!window.confirm("¿Estás seguro de liberar el servicio de este prestador? Esta acción es irreversible.")) return;
    try {
      await fetch(`http://localhost:5000/api/usuarios/${id}/liberar`, { method: 'PUT' });
      alert("Servicio liberado exitosamente.");
      setPrestadorSeleccionado(null);
      cargarDatos();
    } catch (err) {
      alert("Error al liberar.");
    }
  };

  const confirmarBaja = async () => {
    if (motivoBaja.trim() === '') return alert("Debes escribir el motivo de la baja.");
    try {
      await fetch(`http://localhost:5000/api/usuarios/${prestadorSeleccionado.id}/baja`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: motivoBaja })
      });
      alert("El prestador ha sido dado de baja.");
      setShowModalBaja(false);
      setPrestadorSeleccionado(null);
      setMotivoBaja('');
      cargarDatos();
    } catch (err) {
      alert("Error al dar de baja.");
    }
  };

  // ==========================================
  // VISTA DEL JEFE DE UDI
  // ==========================================
  if (rolUsuario === 'Jefe de UDI') {
    return (
      <div style={{ textAlign: 'left', position: 'relative' }}>
        <h3 style={{ color: GUINDA_IPN }}>Estado General de Prestadores</h3>
        {errorMsg && <div style={{ color: 'red' }}>{errorMsg}</div>}
        
        {/* GRID DE TARJETAS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {Array.isArray(datos) && datos.map((p) => {
            const porcentaje = Math.min((p.horas_totales / META_HORAS) * 100, 100).toFixed(1);
            return (
              <div 
                key={p.id} 
                onClick={() => setPrestadorSeleccionado(p)}
                style={{ 
                  border: `2px solid ${p.estado_servicio === 'Liberado' ? 'green' : p.estado_servicio === 'Baja' ? 'red' : '#ccc'}`, 
                  borderRadius: '8px', padding: '15px', cursor: 'pointer', backgroundColor: '#fcfcfc',
                  transition: 'transform 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}
              >
                <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>{p.nombre}</h4>
                
                {/* Etiqueta de Estado */}
                <div style={{ marginBottom: '10px', fontSize: '0.8rem', fontWeight: 'bold', padding: '4px', borderRadius: '4px', display: 'inline-block', backgroundColor: p.estado_servicio === 'Liberado' ? '#e8f5e9' : p.estado_servicio === 'Baja' ? '#ffebee' : '#e3f2fd', color: p.estado_servicio === 'Liberado' ? 'green' : p.estado_servicio === 'Baja' ? 'red' : '#1976d2' }}>
                  {p.estado_servicio.toUpperCase()}
                </div>

                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>Progreso de Horas:</div>
                <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '4px', height: '10px', overflow: 'hidden' }}>
                  <div style={{ width: `${porcentaje}%`, backgroundColor: GUINDA_IPN, height: '100%' }}></div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.8rem', marginTop: '5px', fontWeight: 'bold' }}>{porcentaje}%</div>
              </div>
            );
          })}
        </div>

        {/* MODAL DE DETALLES DEL PRESTADOR */}
        {prestadorSeleccionado && !showModalBaja && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '450px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
              <h2 style={{ marginTop: 0, color: GUINDA_IPN }}>{prestadorSeleccionado.nombre}</h2>
              <p><strong>Boleta:</strong> {prestadorSeleccionado.boleta}</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', borderBottom: '1px solid #eee', padding: '15px 0', margin: '15px 0' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 'bold', color: prestadorSeleccionado.reportes_validados >= META_REPORTES ? 'green' : '#ff9800' }}>
                    {prestadorSeleccionado.reportes_validados} / {META_REPORTES}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>Reportes Validados</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 'bold', color: prestadorSeleccionado.horas_totales >= META_HORAS ? 'green' : '#0055a4' }}>
                    {formatoHoras(prestadorSeleccionado.horas_totales)}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>Horas Acumuladas</span>
                </div>
              </div>

              {prestadorSeleccionado.estado_servicio === 'Activo' && (
                <div style={{ marginBottom: '20px', color: '#d32f2f', fontWeight: 'bold', textAlign: 'center' }}>
                  Faltan {formatoHoras(Math.max(META_HORAS - prestadorSeleccionado.horas_totales, 0))} para concluir.
                </div>
              )}

              {/* Botones de Control */}
              {prestadorSeleccionado.estado_servicio === 'Activo' ? (
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button 
                    onClick={() => setShowModalBaja(true)}
                    style={{ flex: 1, padding: '10px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                    Dar de Baja
                  </button>
                  <button 
                    onClick={() => liberarServicio(prestadorSeleccionado.id)}
                    disabled={prestadorSeleccionado.horas_totales < META_HORAS || prestadorSeleccionado.reportes_validados < META_REPORTES}
                    title={prestadorSeleccionado.horas_totales < META_HORAS || prestadorSeleccionado.reportes_validados < META_REPORTES ? "Faltan horas o reportes por validar" : ""}
                    style={{ flex: 1, padding: '10px', backgroundColor: (prestadorSeleccionado.horas_totales >= META_HORAS && prestadorSeleccionado.reportes_validados >= META_REPORTES) ? '#4CAF50' : '#ccc', color: 'white', border: 'none', borderRadius: '4px', cursor: (prestadorSeleccionado.horas_totales >= META_HORAS && prestadorSeleccionado.reportes_validados >= META_REPORTES) ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
                    Liberar Servicio
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontWeight: 'bold', color: '#555' }}>
                  Este usuario ya fue {prestadorSeleccionado.estado_servicio === 'Liberado' ? 'Liberado' : 'Dado de Baja'}.
                </div>
              )}
              
              <button onClick={() => setPrestadorSeleccionado(null)} style={{ width: '100%', marginTop: '10px', padding: '10px', backgroundColor: 'transparent', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>
                Cerrar
              </button>
            </div>
          </div>
        )}

        {/* MODAL PARA DAR DE BAJA (Confirmación y Motivo) */}
        {showModalBaja && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001 }}>
            <div style={{ backgroundColor: '#ffebee', border: '2px solid #d32f2f', padding: '25px', borderRadius: '8px', width: '400px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
              <h3 style={{ marginTop: 0, color: '#d32f2f' }}>⚠️ Confirmar Baja</h3>
              <p style={{ fontSize: '0.9rem', color: '#555' }}>Estás a punto de expulsar a <strong>{prestadorSeleccionado.nombre}</strong>. Por favor indica el motivo:</p>
              <textarea 
                value={motivoBaja} 
                onChange={(e) => setMotivoBaja(e.target.value)} 
                rows="4" 
                style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px', resize: 'none' }}
                placeholder="Ej. Inasistencias consecutivas, indisciplina..."
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px' }}>
                <button onClick={() => setShowModalBaja(false)} style={{ padding: '8px 15px', backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Cancelar</button>
                <button onClick={confirmarBaja} style={{ padding: '8px 15px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Expulsar Definitivamente</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // VISTA DEL PRESTADOR DE SERVICIO
  // ==========================================
  if (!datos) return <div>Cargando mi estado...</div>;

  const porcentaje = Math.min((datos.horas_totales / META_HORAS) * 100, 100).toFixed(1);

  return (
    <div style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto' }}>
      <h3 style={{ color: GUINDA_IPN, textAlign: 'center' }}>Mi Estado del Servicio</h3>
      
      {/* BANNER DE LIBERACIÓN */}
      {datos.estado_servicio === 'Liberado' && (
        <div style={{ backgroundColor: '#e8f5e9', border: '2px solid #4CAF50', padding: '20px', borderRadius: '8px', textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#2e7d32', margin: '0 0 10px 0' }}>🎉 ¡Servicio Liberado! 🎉</h2>
          <p style={{ margin: 0, color: '#555' }}>Felicidades, has concluido satisfactoriamente con tus horas y reportes. Pasa a UDI por tu carta de liberación.</p>
        </div>
      )}

      {/* BANNER DE BAJA */}
      {datos.estado_servicio === 'Baja' && (
        <div style={{ backgroundColor: '#ffebee', border: '2px solid #d32f2f', padding: '20px', borderRadius: '8px', textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#d32f2f', margin: '0 0 10px 0' }}>🚫 Has sido dado de baja 🚫</h2>
          <p style={{ margin: 0, color: '#555', fontWeight: 'bold' }}>Motivo:</p>
          <p style={{ margin: '5px 0 0 0', fontStyle: 'italic', color: '#333' }}>"{datos.motivo_baja}"</p>
        </div>
      )}

      {/* TARJETA DE INFORMACIÓN PRINCIPAL */}
      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <h2 style={{ marginTop: 0, borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' }}>{datos.nombre}</h2>
        <p style={{ color: '#666' }}><strong>Boleta:</strong> {datos.boleta}</p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
          <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '2rem', display: 'block', fontWeight: 'bold', color: datos.horas_totales >= META_HORAS ? 'green' : GUINDA_IPN }}>
              {formatoHoras(datos.horas_totales)}
            </span>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>Horas Acreditadas (Meta: {META_HORAS}h)</span>
          </div>
          
          <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '2rem', display: 'block', fontWeight: 'bold', color: datos.reportes_validados >= META_REPORTES ? 'green' : GUINDA_IPN }}>
              {datos.reportes_validados}
            </span>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>Reportes Validados (Meta: {META_REPORTES})</span>
          </div>
        </div>

        {datos.estado_servicio === 'Activo' && (
          <div style={{ marginTop: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold', color: '#555' }}>Progreso de Horas</span>
              <span style={{ fontWeight: 'bold', color: GUINDA_IPN }}>{porcentaje}%</span>
            </div>
            <div style={{ width: '100%', backgroundColor: '#e0e0e0', borderRadius: '6px', height: '14px', overflow: 'hidden' }}>
              <div style={{ width: `${porcentaje}%`, backgroundColor: GUINDA_IPN, height: '100%', transition: 'width 0.5s' }}></div>
            </div>
            <p style={{ textAlign: 'center', marginTop: '15px', color: '#d32f2f', fontWeight: 'bold' }}>
              Te faltan {formatoHoras(Math.max(META_HORAS - datos.horas_totales, 0))} para alcanzar la meta.
            </p>
          </div>
        )}
      </div>

    </div>
  );
};

export default EstadoPrestadores;