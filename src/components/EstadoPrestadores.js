import React, { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';

const GUINDA_IPN = '#750946';
const META_HORAS = 480;
const META_REPORTES = 7;

const EstadoPrestadores = () => {
  const nombreUsuario = localStorage.getItem('userName');
  const rolUsuario = localStorage.getItem('userRole');

  const [datos, setDatos] = useState(rolUsuario === 'Jefe de UDI' ? [] : null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // --- Estados Modales del Jefe ---
  const [prestadorSeleccionado, setPrestadorSeleccionado] = useState(null);
  const [showModalBaja, setShowModalBaja] = useState(false);
  const [motivoBaja, setMotivoBaja] = useState('');
  const [horasASumar, setHorasASumar] = useState('');

  // --- Estados Modal Cambiar Contraseña (Prestador) ---
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [actualPassword, setActualPassword] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  
  // --- Estados del CAPTCHA ---
  const canvasRef = useRef(null);
  const [captchaTextoReal, setCaptchaTextoReal] = useState('');
  const [respuestaUsuario, setRespuestaUsuario] = useState('');
  const [captchaValido, setCaptchaValido] = useState(false);

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

  const formatoHoras = (horasDecimales) => {
    const h = Math.floor(horasDecimales || 0);
    const m = Math.round(((horasDecimales || 0) - h) * 60);
    return `${h}h ${m}m`;
  };

  // --- LÓGICA DEL CAPTCHA (Igual al Login) ---
  const generarCaptchaVisual = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f2f2f2';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let textoGenerado = '';

    for (let i = 0; i < 6; i++) {
      const char = caracteres.charAt(Math.floor(Math.random() * caracteres.length));
      textoGenerado += char;
      ctx.font = `${Math.floor(Math.random() * 10) + 20}px Arial, sans-serif`;
      ctx.fillStyle = `#${Math.floor(Math.random()*16777215).toString(16)}`;
      ctx.save();
      ctx.translate(20 + i * 25, 30);
      ctx.rotate((Math.random() - 0.5) * 0.4);
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }

    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.strokeStyle = `rgba(0,0,0, ${Math.random()})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    setCaptchaTextoReal(textoGenerado);
    setRespuestaUsuario('');
    setCaptchaValido(false);
  }, []);

  // Generar CAPTCHA solo cuando se abre la modal
  useEffect(() => {
    if (showModalPassword) {
      setTimeout(() => generarCaptchaVisual(), 100); 
    }
  }, [showModalPassword, generarCaptchaVisual]);

  const handleCaptchaChange = (e) => {
    const valor = e.target.value;
    setRespuestaUsuario(valor);
    if (valor.toLowerCase() === captchaTextoReal.toLowerCase()) setCaptchaValido(true);
    else setCaptchaValido(false);
  };

  // --- ACCIONES DE BASE DE DATOS ---
  const liberarServicio = async (id) => {
    if (!window.confirm("¿Estás seguro de liberar el servicio de este prestador?")) return;
    try {
      await fetch(`http://localhost:5000/api/usuarios/${id}/liberar`, { method: 'PUT' });
      toast.success("Servicio liberado exitosamente.");
      setPrestadorSeleccionado(null);
      cargarDatos();
    } catch (err) { toast.error("Error al liberar."); }
  };

  const confirmarBaja = async () => {
    if (motivoBaja.trim() === '') return toast.error("Debes escribir el motivo de la baja.");
    try {
      await fetch(`http://localhost:5000/api/usuarios/${prestadorSeleccionado.id}/baja`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ motivo: motivoBaja })
      });
      toast.success("El prestador ha sido dado de baja.");
      setShowModalBaja(false);
      setPrestadorSeleccionado(null);
      setMotivoBaja('');
      cargarDatos();
    } catch (err) { toast.error("Error al dar de baja."); }
  };

  const sumarHorasManuales = async () => {
    const horas = parseFloat(horasASumar);
    if (isNaN(horas) || horas <= 0) return toast.error("Ingresa una cantidad válida de horas (ej. 5 o 2.5).");
    if (!window.confirm(`¿Seguro que quieres sumarle ${horas} horas extra a ${prestadorSeleccionado.nombre}?`)) return;

    try {
      await fetch(`http://localhost:5000/api/usuarios/${prestadorSeleccionado.id}/sumar-horas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ horas_extra: horas })
      });
      toast.success("Horas sumadas exitosamente.");
      
      setPrestadorSeleccionado({
        ...prestadorSeleccionado,
        horas_totales: Number(prestadorSeleccionado.horas_totales) + horas
      });
      setHorasASumar('');
      cargarDatos(); 
    } catch (err) {
      toast.error("Error al sumar horas.");
    }
  };

  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    if (!captchaValido) return toast.error("CAPTCHA incorrecto.");

    try {
      const res = await fetch('http://localhost:5000/api/cambiar-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombreUsuario, actualPassword, nuevaPassword })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        toast.success(data.message);
        setShowModalPassword(false);
        setActualPassword('');
        setNuevaPassword('');
      } else {
        toast.error(data.message || "Error al actualizar la contraseña");
        generarCaptchaVisual(); 
      }
    } catch (err) { toast.error("Error de red."); }
  };

  // ==========================================
  // VISTA DEL JEFE DE UDI
  // ==========================================
  if (rolUsuario === 'Jefe de UDI') {
    return (
      <div style={{ textAlign: 'left', position: 'relative' }}>
        <h3 style={{ color: GUINDA_IPN }}>Estado General de Prestadores</h3>
        {errorMsg && <div style={{ color: 'red' }}>{errorMsg}</div>}
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
          {Array.isArray(datos) && datos.map((p) => {
            const horasValidas = Number(p.horas_totales) || 0;
            const porcentaje = Math.min((horasValidas / META_HORAS) * 100, 100).toFixed(1);
            return (
              <div key={p.id} onClick={() => setPrestadorSeleccionado(p)} style={{ border: `2px solid ${p.estado_servicio === 'Liberado' ? 'green' : p.estado_servicio === 'Baja' ? 'red' : '#ccc'}`, borderRadius: '8px', padding: '15px', cursor: 'pointer', backgroundColor: '#fcfcfc', transition: 'transform 0.2s', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>{p.nombre}</h4>
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

        {/* MODALES DEL JEFE */}
        {prestadorSeleccionado && !showModalBaja && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '450px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
              <h2 style={{ marginTop: 0, color: GUINDA_IPN }}>{prestadorSeleccionado.nombre}</h2>
              <p><strong>Boleta:</strong> {prestadorSeleccionado.boleta}</p>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eee', borderBottom: '1px solid #eee', padding: '15px 0', margin: '15px 0' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 'bold', color: (Number(prestadorSeleccionado.reportes_validados) || 0) >= META_REPORTES ? 'green' : '#ff9800' }}>
                    {Number(prestadorSeleccionado.reportes_validados) || 0} / {META_REPORTES}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>Reportes Validados</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ display: 'block', fontSize: '1.5rem', fontWeight: 'bold', color: (Number(prestadorSeleccionado.horas_totales) || 0) >= META_HORAS ? 'green' : '#0055a4' }}>
                    {formatoHoras(Number(prestadorSeleccionado.horas_totales) || 0)}
                  </span>
                  <span style={{ fontSize: '0.8rem', color: '#666' }}>Horas Acumuladas</span>
                </div>
              </div>

              {prestadorSeleccionado.estado_servicio === 'Activo' && (
                <div style={{ marginBottom: '20px', color: '#d32f2f', fontWeight: 'bold', textAlign: 'center' }}>
                  Faltan {formatoHoras(Math.max(META_HORAS - (Number(prestadorSeleccionado.horas_totales) || 0), 0))} para concluir.
                </div>
              )}

              {/* --- NUEVA SECCIÓN: AJUSTE MANUAL DE HORAS --- */}
              {prestadorSeleccionado.estado_servicio === 'Activo' && (
                <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#eef2f5', borderRadius: '8px', border: '1px solid #cdd5dc' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '0.9rem' }}>⏱️ Ajuste Manual de Horas</h4>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input 
                      type="number" 
                      step="0.5" 
                      min="0" 
                      value={horasASumar} 
                      onChange={(e) => setHorasASumar(e.target.value)} 
                      placeholder="Ej. 5 o 2.5" 
                      style={{ flex: 1, padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} 
                    />
                    <button 
                      onClick={sumarHorasManuales} 
                      style={{ padding: '8px 15px', backgroundColor: '#0055a4', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
                      Sumar
                    </button>
                  </div>
                </div>
              )}

              {prestadorSeleccionado.estado_servicio === 'Activo' ? (
                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button onClick={() => setShowModalBaja(true)} style={{ flex: 1, padding: '10px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Dar de Baja</button>
                  <button 
                    onClick={() => liberarServicio(prestadorSeleccionado.id)}
                    disabled={(Number(prestadorSeleccionado.horas_totales) || 0) < META_HORAS || (Number(prestadorSeleccionado.reportes_validados) || 0) < META_REPORTES}
                    style={{ flex: 1, padding: '10px', backgroundColor: ((Number(prestadorSeleccionado.horas_totales) || 0) >= META_HORAS && (Number(prestadorSeleccionado.reportes_validados) || 0) >= META_REPORTES) ? '#4CAF50' : '#ccc', color: 'white', border: 'none', borderRadius: '4px', cursor: ((Number(prestadorSeleccionado.horas_totales) || 0) >= META_HORAS && (Number(prestadorSeleccionado.reportes_validados) || 0) >= META_REPORTES) ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>
                    Liberar Servicio
                  </button>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px', fontWeight: 'bold', color: '#555' }}>
                  Este usuario ya fue {prestadorSeleccionado.estado_servicio === 'Liberado' ? 'Liberado' : 'Dado de Baja'}.
                </div>
              )}
              <button onClick={() => setPrestadorSeleccionado(null)} style={{ width: '100%', marginTop: '10px', padding: '10px', backgroundColor: 'transparent', border: '1px solid #ccc', borderRadius: '4px', cursor: 'pointer' }}>Cerrar</button>
            </div>
          </div>
        )}

        {showModalBaja && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1001 }}>
            <div style={{ backgroundColor: '#ffebee', border: '2px solid #d32f2f', padding: '25px', borderRadius: '8px', width: '400px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
              <h3 style={{ marginTop: 0, color: '#d32f2f' }}>⚠️ Confirmar Baja</h3>
              <p style={{ fontSize: '0.9rem', color: '#555' }}>Estás a punto de expulsar a <strong>{prestadorSeleccionado.nombre}</strong>. Motivo:</p>
              <textarea value={motivoBaja} onChange={(e) => setMotivoBaja(e.target.value)} rows="4" style={{ width: '100%', padding: '10px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px', resize: 'none' }} placeholder="Ej. Inasistencias..." />
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

  const horasTotales = Number(datos.horas_totales) || 0;
  const reportesValidados = Number(datos.reportes_validados) || 0;
  const porcentaje = Math.min((horasTotales / META_HORAS) * 100, 100).toFixed(1);

  return (
    <div style={{ textAlign: 'left', maxWidth: '600px', margin: '0 auto', position: 'relative' }}>
      <h3 style={{ color: GUINDA_IPN, textAlign: 'center' }}>Mi Estado del Servicio</h3>
      
      {/* BANNERS DE ESTATUS */}
      {datos.estado_servicio === 'Liberado' && (
        <div style={{ backgroundColor: '#e8f5e9', border: '2px solid #4CAF50', padding: '20px', borderRadius: '8px', textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#2e7d32', margin: '0 0 10px 0' }}>🎉 ¡Servicio Liberado! 🎉</h2>
          <p style={{ margin: 0, color: '#555' }}>Felicidades, has concluido satisfactoriamente con tus horas y reportes.</p>
        </div>
      )}

      {datos.estado_servicio === 'Baja' && (
        <div style={{ backgroundColor: '#ffebee', border: '2px solid #d32f2f', padding: '20px', borderRadius: '8px', textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ color: '#d32f2f', margin: '0 0 10px 0' }}>🚫 Has sido dado de baja 🚫</h2>
          <p style={{ margin: 0, color: '#555', fontWeight: 'bold' }}>Motivo:</p>
          <p style={{ margin: '5px 0 0 0', fontStyle: 'italic', color: '#333' }}>"{datos.motivo_baja}"</p>
        </div>
      )}

      {/* TARJETA PRINCIPAL Y BOTÓN DE CONTRASEÑA */}
      <div style={{ border: '1px solid #ccc', borderRadius: '8px', padding: '20px', backgroundColor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f0f0f0', paddingBottom: '10px' }}>
          <div>
            <h2 style={{ margin: 0, color: '#333' }}>{datos.nombre}</h2>
            <p style={{ color: '#666', margin: '5px 0 0 0' }}><strong>Boleta:</strong> {datos.boleta}</p>
          </div>
          
          <button 
            onClick={() => setShowModalPassword(true)}
            style={{ backgroundColor: GUINDA_IPN, color: 'white', border: 'none', padding: '8px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
            🔒 Cambiar Contraseña
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '20px' }}>
          <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '2rem', display: 'block', fontWeight: 'bold', color: horasTotales >= META_HORAS ? 'green' : GUINDA_IPN }}>
              {formatoHoras(horasTotales)}
            </span>
            <span style={{ fontSize: '0.9rem', color: '#666' }}>Horas Acreditadas (Meta: {META_HORAS}h)</span>
          </div>
          
          <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
            <span style={{ fontSize: '2rem', display: 'block', fontWeight: 'bold', color: reportesValidados >= META_REPORTES ? 'green' : GUINDA_IPN }}>
              {reportesValidados}
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
              Te faltan {formatoHoras(Math.max(META_HORAS - horasTotales, 0))} para alcanzar la meta.
            </p>
          </div>
        )}
      </div>

      {/* MODAL DE CAMBIO DE CONTRASEÑA CON CAPTCHA */}
      {showModalPassword && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '380px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}>
            <h3 style={{ marginTop: 0, color: '#333', textAlign: 'center' }}>Autenticación y Seguridad</h3>
            <p style={{ fontSize: '0.85rem', color: '#666', textAlign: 'center', marginBottom: '20px' }}>Verifica tu identidad para cambiar tu contraseña.</p>
            
            <form onSubmit={handleCambiarPassword}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', fontWeight: 'bold' }}>Contraseña Actual:</label>
                <input type="password" value={actualPassword} onChange={(e) => setActualPassword(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} required />
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', marginBottom: '5px', fontWeight: 'bold' }}>Nueva Contraseña:</label>
                <input type="password" value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box', border: '1px solid #ccc', borderRadius: '4px' }} required />
              </div>

              {/* SECCIÓN DEL CAPTCHA */}
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fafafa', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'center' }}>
                <label style={{ display: 'block', marginBottom: '10px', fontSize: '0.85rem', color: '#555' }}>Resuelve el CAPTCHA de seguridad:</label>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <div style={{ position: 'relative' }}>
                    <canvas ref={canvasRef} width="160" height="45" style={{ border: '1px solid #ccc', borderRadius: '4px', letterSpacing: '2px', backgroundColor: '#fff' }}></canvas>
                    <button type="button" onClick={generarCaptchaVisual} style={{ position: 'absolute', right: '-30px', top: '8px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }} title="Cambiar imagen">🔄</button>
                  </div>
                  <input type="text" value={respuestaUsuario} onChange={handleCaptchaChange} maxLength="6" placeholder="Ingresa el código" style={{ width: '140px', padding: '8px', textAlign: 'center', textTransform: 'uppercase', border: captchaValido ? '2px solid green' : '1px solid #ccc' }} required />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <button type="button" onClick={() => setShowModalPassword(false)} style={{ flex: 1, padding: '10px', backgroundColor: '#e0e0e0', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', color: '#555' }}>Cancelar</button>
                <button type="submit" disabled={!captchaValido} style={{ flex: 1, padding: '10px', backgroundColor: captchaValido ? GUINDA_IPN : '#ccc', color: 'white', border: 'none', borderRadius: '4px', cursor: captchaValido ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}>Actualizar</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default EstadoPrestadores;