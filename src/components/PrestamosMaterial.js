import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

const GUINDA_IPN = '#750946';

const PrestamosMaterial = () => {
  // Estados del Formulario de Préstamo
  const [solicitante, setSolicitante] = useState('');
  const [identificacion, setIdentificacion] = useState('');
  const [material, setMaterial] = useState('');
  // Por defecto ponemos la fecha y hora actual para ahorrar clics
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [horaPrestamo, setHoraPrestamo] = useState(new Date().toTimeString().slice(0,5));

  // Estados Globales
  const [registros, setRegistros] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Estados de Filtros
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroMaterial, setFiltroMaterial] = useState('');
  const [filtroHora, setFiltroHora] = useState('');

  // Estados del Modal de Devolución
  const [showModal, setShowModal] = useState(false);
  const [prestamoSeleccionado, setPrestamoSeleccionado] = useState(null);
  const [modalHoraDevolucion, setModalHoraDevolucion] = useState('');
  const [modalEstadoMaterial, setModalEstadoMaterial] = useState('Funcional');
  const [isReturning, setIsReturning] = useState(false);

  const cargarDatos = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/prestamos');
      const data = await res.json();
      setRegistros(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Error al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // REGISTRAR NUEVO PRÉSTAMO
  const handleSubir = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const prestadorActual = localStorage.getItem('userName') || 'Usuario Desconocido';

    const nuevoPrestamo = { 
      solicitante, 
      identificacion, 
      material, 
      fecha, 
      hora_prestamo: horaPrestamo, 
      prestador_entrega: prestadorActual 
    };

    try {
      const respuesta = await fetch('http://localhost:5000/api/prestamos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoPrestamo)
      });
      const data = await respuesta.json();
      
      if (respuesta.ok && data.success) {
        toast.success("¡Préstamo registrado exitosamente!");
        setSolicitante(''); setIdentificacion(''); setMaterial(''); 
        setFecha(new Date().toISOString().split('T')[0]);
        setHoraPrestamo(new Date().toTimeString().slice(0,5));
        cargarDatos(); 
      } else {
        toast.error(`Error: ${data.error || 'No se pudo guardar.'}`);
      }
    } catch (error) {
      toast.error("Error de red al intentar guardar.");
    } finally {
      setIsLoading(false);
    }
  };

  // --- LÓGICA DEL MODAL DE DEVOLUCIÓN ---
  const abrirModalDevolucion = (registro) => {
    setPrestamoSeleccionado(registro);
    setModalHoraDevolucion(new Date().toTimeString().slice(0,5));
    setModalEstadoMaterial('Funcional');
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setPrestamoSeleccionado(null);
  };

  const guardarDevolucion = async () => {
    setIsReturning(true);
    const prestadorActual = localStorage.getItem('userName') || 'Usuario Desconocido';

    try {
      const respuesta = await fetch(`http://localhost:5000/api/prestamos/${prestamoSeleccionado.id}/devolucion`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hora_devolucion: modalHoraDevolucion,
          estado_material: modalEstadoMaterial,
          prestador_recibe: prestadorActual
        })
      });
      
      const data = await respuesta.json();

      if (respuesta.ok && data.success) {
        toast.success("¡Material devuelto correctamente!");
        cerrarModal();
        cargarDatos(); 
      } else {
        toast.error("Error al registrar la devolución.");
      }
    } catch (error) {
      toast.error("Error de red al intentar actualizar.");
    } finally {
      setIsReturning(false);
    }
  };

  // FILTROS
  const registrosFiltrados = registros.filter((reg) => {
    const cumpleFecha = filtroFecha ? reg.fecha.includes(filtroFecha) : true;
    const cumpleMaterial = filtroMaterial ? reg.material.toLowerCase().includes(filtroMaterial.toLowerCase()) : true;
    const cumpleHora = filtroHora ? reg.hora_prestamo.startsWith(filtroHora) : true;
    return cumpleFecha && cumpleMaterial && cumpleHora;
  });

  const limpiarFiltros = () => {
    setFiltroFecha(''); setFiltroMaterial(''); setFiltroHora('');
    toast.info("Filtros limpiados");
  };

  const exportarAExcel = () => {
    if (registrosFiltrados.length === 0) return toast.warning("No hay datos para exportar.");
    const datosParaExcel = registrosFiltrados.map(reg => ({
      "Fecha": new Date(reg.fecha).toLocaleDateString(),
      "Solicitante": reg.solicitante,
      "Boleta/Num Emp": reg.identificacion,
      "Material": reg.material,
      "Hora Préstamo": reg.hora_prestamo,
      "Hora Devolución": reg.hora_devolucion || 'PENDIENTE',
      "Estado Material": reg.estado_material || 'N/A',
      "Entregó (Prestador)": reg.prestador_entrega,
      "Recibió (Prestador)": reg.prestador_recibe || 'N/A'
    }));
    const hoja = XLSX.utils.json_to_sheet(datosParaExcel);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Préstamos");
    XLSX.writeFile(libro, `Bitacora_Prestamos_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
    toast.success("¡Excel descargado exitosamente!");
  };

  return (
    <div style={{ textAlign: 'left', position: 'relative' }}>
      
      {/* --- MODAL DE DEVOLUCIÓN --- */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 }}>
          <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '12px', width: '90%', maxWidth: '500px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <h3 style={{ marginTop: 0, color: GUINDA_IPN, borderBottom: '2px solid #eee', paddingBottom: '10px' }}>📦 Recibir Material</h3>
            
            <div style={{ backgroundColor: '#eef2f5', padding: '12px', borderRadius: '8px', marginBottom: '15px', fontSize: '0.9rem', color: '#555', borderLeft: `4px solid ${GUINDA_IPN}` }}>
              <strong>Material:</strong> {prestamoSeleccionado?.material} <br/>
              <strong>Solicitante:</strong> {prestamoSeleccionado?.solicitante}
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>Hora de Devolución:</label> 
              <input type="time" value={modalHoraDevolucion} onChange={(e) => setModalHoraDevolucion(e.target.value)} style={{ width: '100%', padding: '8px', boxSizing: 'border-box', marginTop: '5px' }} required />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>¿En qué estado lo entregan?:</label>
              <select value={modalEstadoMaterial} onChange={(e) => setModalEstadoMaterial(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing:'border-box', border: '1px solid #ccc', borderRadius: '4px' }}>
                <option value="Funcional">✅ Funcional (Buen estado)</option>
                <option value="Dañado">⚠️ Dañado / Incompleto</option>
                <option value="Perdido">❌ Perdido</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
              <button onClick={cerrarModal} style={{ padding: '8px 15px', backgroundColor: '#e0e0e0', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#333', fontWeight: 'bold' }}>Cancelar</button>
              <button onClick={guardarDevolucion} disabled={isReturning} style={{ padding: '8px 15px', backgroundColor: GUINDA_IPN, border: 'none', borderRadius: '6px', cursor: 'pointer', color: 'white', fontWeight: 'bold' }}>
                {isReturning ? 'Guardando...' : 'Confirmar Devolución'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ENCABEZADO */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: GUINDA_IPN, margin: 0 }}>Bitácora de Préstamos</h3>
        <button onClick={exportarAExcel} style={{ backgroundColor: '#217346', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
          <span>📊</span> Exportar a Excel
        </button>
      </div>
      
      {/* FORMULARIO DE NUEVO PRÉSTAMO */}
      <div style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '20px', borderRadius: '8px', backgroundColor: '#fdfdfd' }}>
        <h4 style={{ marginTop: 0, color: '#333' }}>+ Registrar Salida de Material</h4>
        <form onSubmit={handleSubir} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div><label>Nombre del Solicitante (Maestro/Alumno):</label><input type="text" value={solicitante} onChange={(e) => setSolicitante(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing:'border-box' }} required /></div>
          <div><label>Boleta o No. Empleado:</label><input type="text" value={identificacion} onChange={(e) => setIdentificacion(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing:'border-box' }} required /></div>
          <div style={{ gridColumn: '1 / -1' }}><label>Material Solicitado (Ej. Cañón 3, Extensión, Adaptador Mac):</label><input type="text" value={material} onChange={(e) => setMaterial(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing:'border-box' }} required /></div>
          <div><label>Fecha:</label><input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing:'border-box' }} required /></div>
          <div><label>Hora de Salida:</label><input type="time" value={horaPrestamo} onChange={(e) => setHoraPrestamo(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing:'border-box' }} required /></div>
          
          <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
            <button type="submit" disabled={isLoading} style={{ padding: '10px 20px', backgroundColor: GUINDA_IPN, color: 'white', border: 'none', borderRadius: '4px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
              {isLoading ? 'Registrando...' : 'Prestar Material'}
            </button>
          </div>
        </form>
      </div>

      {/* BUSCADOR */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#eef2f5', borderRadius: '8px', border: '1px solid #cdd5dc' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#444' }}>🔍 Buscar y Filtrar</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
          <input type="date" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} title="Filtrar por Fecha" />
          <input type="text" placeholder="📦 Buscar Material..." value={filtroMaterial} onChange={(e) => setFiltroMaterial(e.target.value)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
          <input type="time" value={filtroHora} onChange={(e) => setFiltroHora(e.target.value)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} title="Filtrar por Hora (Aprox)" />
          <button onClick={limpiarFiltros} style={{ padding: '8px', backgroundColor: '#757575', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Limpiar</button>
        </div>
      </div>

      {/* TABLA RESPONSIVA */}
      <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', minWidth: '900px' }}>
          <thead>
            <tr style={{ backgroundColor: '#636569', color: 'white', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Fecha</th>
              <th style={{ padding: '12px' }}>Solicitante</th>
              <th style={{ padding: '12px' }}>Material</th>
              <th style={{ padding: '12px' }}>Salida</th>
              <th style={{ padding: '12px' }}>Devolución</th>
              <th style={{ padding: '12px' }}>Estado</th>
              <th style={{ padding: '12px' }}>Entregó</th>
              <th style={{ padding: '12px' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {registrosFiltrados.length > 0 ? (
              registrosFiltrados.map((reg) => (
                <tr key={reg.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>{new Date(reg.fecha).toLocaleDateString()}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 'bold', color: '#333' }}>{reg.solicitante}</div>
                    <div style={{ fontSize: '0.75rem', color: '#777' }}>ID: {reg.identificacion}</div>
                  </td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{reg.material}</td>
                  <td style={{ padding: '12px', color: '#0055a4', fontWeight: 'bold' }}>{reg.hora_prestamo}</td>
                  <td style={{ padding: '12px', color: reg.hora_devolucion ? '#2e7d32' : '#d32f2f', fontWeight: 'bold' }}>
                    {reg.hora_devolucion || 'PENDIENTE'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {reg.estado_material ? (
                      <span style={{ 
                        padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold',
                        backgroundColor: reg.estado_material === 'Funcional' ? '#e8f5e9' : '#ffebee',
                        color: reg.estado_material === 'Funcional' ? 'green' : 'red' 
                      }}>
                        {reg.estado_material}
                      </span>
                    ) : '--'}
                  </td>
                  <td style={{ padding: '12px' }}>{reg.prestador_entrega}</td>
                  <td style={{ padding: '12px' }}>
                    {/* Botón mágico que desaparece cuando ya entregaron las cosas */}
                    {!reg.hora_devolucion ? (
                      <button 
                        onClick={() => abrirModalDevolucion(reg)}
                        style={{ backgroundColor: GUINDA_IPN, color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Recibir
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: '#666' }}>Recibió:<br/><b>{reg.prestador_recibe}</b></span>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No hay préstamos registrados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#666', textAlign: 'right' }}>
        Mostrando {registrosFiltrados.length} de {registros.length} registros totales.
      </div>
    </div>
  );
};

export default PrestamosMaterial;