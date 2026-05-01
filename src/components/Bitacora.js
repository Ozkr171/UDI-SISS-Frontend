import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

const GUINDA_IPN = '#750946';

const Bitacora = () => {
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [reporte, setReporte] = useState('');
  const [donde, setDonde] = useState('');
  const [resultado, setResultado] = useState('Exitoso');
  const [comentarios, setComentarios] = useState('');
  const [prestadoresSeleccionados, setPrestadoresSeleccionados] = useState([]); 

  const [registros, setRegistros] = useState([]);
  const [listaPrestadores, setListaPrestadores] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroLugar, setFiltroLugar] = useState('');
  const [filtroReporte, setFiltroReporte] = useState('');
  const [filtroResultado, setFiltroResultado] = useState('');
  const [filtroPrestador, setFiltroPrestador] = useState('');

  const cargarDatos = useCallback(async () => {
    setIsLoading(true);
    try {
      const resBitacora = await fetch('http://localhost:5000/api/bitacora');
      const dataBitacora = await resBitacora.json();
      setRegistros(Array.isArray(dataBitacora) ? dataBitacora : []);

      const resPrestadores = await fetch('http://localhost:5000/api/prestadores');
      const dataPrestadores = await resPrestadores.json();
      setListaPrestadores(Array.isArray(dataPrestadores) ? dataPrestadores : []);
    } catch (err) {
      toast.error("Error al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const agregarPrestador = (e) => {
    const nombre = e.target.value;
    if (nombre && !prestadoresSeleccionados.includes(nombre)) {
      setPrestadoresSeleccionados([...prestadoresSeleccionados, nombre]);
    }
    e.target.value = ''; 
  };

  const quitarPrestador = (nombreAEliminar) => {
    setPrestadoresSeleccionados(prestadoresSeleccionados.filter(p => p !== nombreAEliminar));
  };

  const handleSubir = async (e) => {
    e.preventDefault();
    if (prestadoresSeleccionados.length === 0) {
      return toast.warning("Debes seleccionar al menos un responsable.");
    }

    setIsLoading(true);
    const nuevoRegistro = { 
      fecha, hora, reporte, donde, resultado, comentarios, 
      prestadores_asignados: prestadoresSeleccionados.join(', ') 
    };

    try {
      const respuesta = await fetch('http://localhost:5000/api/bitacora', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoRegistro)
      });
      
      const data = await respuesta.json();

      if (respuesta.ok && data.success) {
        toast.success("¡Reporte agregado a la bitácora!");
        setFecha(''); setHora(''); setReporte(''); setDonde(''); setResultado('Exitoso'); setComentarios(''); 
        setPrestadoresSeleccionados([]); 
        cargarDatos(); 
      } else {
        toast.error(`Error: ${data.error || 'No se pudo guardar.'}`);
      }
    } catch (error) {
      toast.error("Error de red al intentar guardar en la bitácora.");
    } finally {
      setIsLoading(false);
    }
  };

  const registrosFiltrados = registros.filter((reg) => {
    const cumpleFecha = filtroFecha ? reg.fecha.includes(filtroFecha) : true;
    const cumpleLugar = filtroLugar ? reg.donde.toLowerCase().includes(filtroLugar.toLowerCase()) : true;
    const cumpleReporte = filtroReporte ? reg.reporte.toLowerCase().includes(filtroReporte.toLowerCase()) : true;
    const cumpleResultado = filtroResultado ? reg.resultado === filtroResultado : true;
    const prestadoresDelRegistro = reg.prestadores_asignados || '';
    const cumplePrestador = filtroPrestador ? prestadoresDelRegistro.toLowerCase().includes(filtroPrestador.toLowerCase()) : true;

    return cumpleFecha && cumpleLugar && cumpleReporte && cumpleResultado && cumplePrestador;
  });

  const limpiarFiltros = () => {
    setFiltroFecha(''); setFiltroLugar(''); setFiltroReporte(''); setFiltroResultado(''); setFiltroPrestador('');
    toast.info("Filtros limpiados");
  };

  // --- NUEVA FUNCIÓN: EXPORTAR A EXCEL ---
  const exportarAExcel = () => {
    if (registrosFiltrados.length === 0) {
      return toast.warning("No hay datos para exportar.");
    }

    // Preparamos los datos limpios para Excel
    const datosParaExcel = registrosFiltrados.map(reg => ({
      "Fecha": new Date(reg.fecha).toLocaleDateString(),
      "Hora": reg.hora || '--:--',
      "Responsables": reg.prestadores_asignados,
      "Lugar del Incidente": reg.donde,
      "Problema Reportado": reg.reporte,
      "Estado Final": reg.resultado,
      "Comentarios/Solución": reg.comentarios
    }));

    // Creamos el libro y la hoja de cálculo
    const hoja = XLSX.utils.json_to_sheet(datosParaExcel);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Reportes de Soporte");

    // Forzamos la descarga del archivo
    XLSX.writeFile(libro, `Bitacora_Soporte_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
    toast.success("¡Excel descargado exitosamente!");
  };

  return (
    <div style={{ textAlign: 'left' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: GUINDA_IPN, margin: 0 }}>Bitácora de Actividades</h3>
        {/* BOTÓN MÁGICO DE EXCEL */}
        <button 
          onClick={exportarAExcel}
          style={{ backgroundColor: '#217346', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }}
        >
          <span>📊</span> Exportar a Excel
        </button>
      </div>
      
      <div style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '20px', borderRadius: '8px', backgroundColor: '#fdfdfd' }}>
        <h4 style={{ marginTop: 0, color: '#333' }}>+ Registrar Nueva Actividad</h4>
        <form onSubmit={handleSubir} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          
          <div><label>Fecha:</label><input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing:'border-box' }} required /></div>
          <div><label>Hora:</label><input type="time" value={hora} onChange={(e) => setHora(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing:'border-box' }} required /></div>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Atendido por (Selecciona uno o varios):</label>
            <select onChange={agregarPrestador} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing:'border-box', border: '1px solid #ccc', borderRadius: '4px' }}>
              <option value="">-- Seleccionar Responsable --</option>
              {listaPrestadores.map((prestador) => (
                <option key={prestador.id} value={prestador.nombre}>{prestador.nombre}</option>
              ))}
            </select>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '10px' }}>
              {prestadoresSeleccionados.map((p) => (
                <div key={p} style={{ backgroundColor: '#eef2f5', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', border: `1px solid ${GUINDA_IPN}` }}>
                  <span style={{ color: '#333', fontWeight: 'bold' }}>{p}</span>
                  <button type="button" onClick={() => quitarPrestador(p)} style={{ background: '#d32f2f', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', fontSize: '0.7rem' }}>X</button>
                </div>
              ))}
              {prestadoresSeleccionados.length === 0 && <span style={{ fontSize: '0.85rem', color: '#888', fontStyle: 'italic' }}>Ningún responsable seleccionado aún.</span>}
            </div>
          </div>

          <div><label>Lugar / Equipo:</label><input type="text" value={donde} onChange={(e) => setDonde(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing:'border-box' }} required /></div>
          <div>
            <label>Resultado:</label>
            <select value={resultado} onChange={(e) => setResultado(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing:'border-box' }}>
              <option value="Exitoso">Exitoso</option>
              <option value="Pendiente">Pendiente</option>
              <option value="No Resuelto">No Resuelto</option>
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}><label>Tipo de Reporte / Problema:</label><input type="text" value={reporte} onChange={(e) => setReporte(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing:'border-box' }} required /></div>
          <div style={{ gridColumn: '1 / -1' }}><label>Comentarios / Solución aplicada:</label><textarea value={comentarios} onChange={(e) => setComentarios(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', height: '60px', boxSizing:'border-box' }} required /></div>
          
          <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
            <button type="submit" disabled={isLoading} style={{ padding: '10px 20px', backgroundColor: GUINDA_IPN, color: 'white', border: 'none', borderRadius: '4px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
              {isLoading ? 'Guardando...' : 'Guardar en Bitácora'}
            </button>
          </div>
        </form>
      </div>

      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#eef2f5', borderRadius: '8px', border: '1px solid #cdd5dc' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#444' }}>🔍 Buscar y Filtrar</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          <input type="date" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
          <select value={filtroPrestador} onChange={(e) => setFiltroPrestador(e.target.value)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
            <option value="">👤 Todos los responsables</option>
            {listaPrestadores.map((p) => <option key={p.id} value={p.nombre}>{p.nombre}</option>)}
          </select>
          <input type="text" placeholder="📍 Lugar (Ej. 101)" value={filtroLugar} onChange={(e) => setFiltroLugar(e.target.value)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
          <input type="text" placeholder="📄 Problema..." value={filtroReporte} onChange={(e) => setFiltroReporte(e.target.value)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
          <select value={filtroResultado} onChange={(e) => setFiltroResultado(e.target.value)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
            <option value="">Cualquier Resultado</option>
            <option value="Exitoso">Exitoso</option>
            <option value="Pendiente">Pendiente</option>
            <option value="No Resuelto">No Resuelto</option>
          </select>
          <button onClick={limpiarFiltros} style={{ padding: '8px', backgroundColor: '#757575', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Limpiar</button>
        </div>
      </div>

      {/* Tabla Responsiva */}
      <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem', minWidth: '800px' }}>
          <thead>
            <tr style={{ backgroundColor: '#636569', color: 'white', textAlign: 'left' }}>
              <th style={{ padding: '12px' }}>Fecha</th>
              <th style={{ padding: '12px' }}>Hora</th>
              <th style={{ padding: '12px' }}>Atendido Por</th>
              <th style={{ padding: '12px' }}>Lugar</th>
              <th style={{ padding: '12px' }}>Problema</th>
              <th style={{ padding: '12px' }}>Resultado</th>
              <th style={{ padding: '12px' }}>Comentarios</th>
            </tr>
          </thead>
          <tbody>
            {registrosFiltrados.length > 0 ? (
              registrosFiltrados.map((reg) => (
                <tr key={reg.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>{new Date(reg.fecha).toLocaleDateString()}</td>
                  <td style={{ padding: '12px', color: '#555' }}>{reg.hora || '--:--'}</td>
                  <td style={{ padding: '12px', color: '#0055a4', fontWeight: 'bold' }}>{reg.prestadores_asignados || 'N/A'}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{reg.donde}</td>
                  <td style={{ padding: '12px' }}>{reg.reporte}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ color: reg.resultado === 'Exitoso' ? 'green' : reg.resultado === 'Pendiente' ? '#ff9800' : 'red', fontWeight: 'bold', padding: '4px 8px', borderRadius: '12px', backgroundColor: reg.resultado === 'Exitoso' ? '#e8f5e9' : reg.resultado === 'Pendiente' ? '#fff3e0' : '#ffebee' }}>
                      {reg.resultado}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{reg.comentarios}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No se encontraron registros.</td></tr>
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

export default Bitacora;