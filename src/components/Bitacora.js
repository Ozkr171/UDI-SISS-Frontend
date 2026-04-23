import React, { useState, useEffect, useCallback } from 'react';

const GUINDA_IPN = '#750946';

const Bitacora = () => {
  // --- ESTADOS DEL FORMULARIO DE REGISTRO ---
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState(''); // NUEVO ESTADO PARA LA HORA
  const [reporte, setReporte] = useState('');
  const [donde, setDonde] = useState('');
  const [resultado, setResultado] = useState('Exitoso');
  const [comentarios, setComentarios] = useState('');
  const [prestadoresAsignados, setPrestadoresAsignados] = useState('');

  // --- ESTADOS DE LA TABLA Y DATOS ---
  const [registros, setRegistros] = useState([]);
  const [listaPrestadores, setListaPrestadores] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  // --- ESTADOS DE LOS FILTROS ---
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
      setErrorMsg("Error al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleSubir = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Agregamos la hora al paquete que viaja al servidor
    const nuevoRegistro = { 
      fecha, 
      hora, 
      reporte, 
      donde, 
      resultado, 
      comentarios, 
      prestadores_asignados: prestadoresAsignados 
    };

    try {
      const respuesta = await fetch('http://localhost:5000/api/bitacora', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoRegistro)
      });
      
      const data = await respuesta.json();

      if (respuesta.ok && data.success) {
        alert("¡Reporte agregado a la bitácora!");
        // Limpiamos todo el formulario incluyendo la hora
        setFecha(''); setHora(''); setReporte(''); setDonde(''); setResultado('Exitoso'); setComentarios(''); setPrestadoresAsignados('');
        cargarDatos(); 
      } else {
        alert(`Error: ${data.error || 'No se pudo guardar.'}`);
      }
    } catch (error) {
      alert("Error de red al intentar guardar en la bitácora.");
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
    setFiltroFecha('');
    setFiltroLugar('');
    setFiltroReporte('');
    setFiltroResultado('');
    setFiltroPrestador('');
  };

  return (
    <div style={{ textAlign: 'left' }}>
      <h3 style={{ color: GUINDA_IPN }}>Bitácora de Actividades (Soporte Técnico)</h3>
      
      {errorMsg && <div style={{ color: 'red', marginBottom: '10px' }}>{errorMsg}</div>}

      <div style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '20px', borderRadius: '8px', backgroundColor: '#fdfdfd' }}>
        <h4 style={{ marginTop: 0, color: '#333' }}>+ Registrar Nueva Actividad</h4>
        <form onSubmit={handleSubir} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          
          {/* FECHA Y HORA ALINEADAS */}
          <div>
            <label>Fecha:</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing:'border-box' }} required />
          </div>

          <div>
            <label>Hora:</label>
            <input type="time" value={hora} onChange={(e) => setHora(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing:'border-box' }} required />
          </div>
          
          <div>
            <label>Atendido por (Prestadores):</label>
            <input type="text" list="lista-prestadores" value={prestadoresAsignados} onChange={(e) => setPrestadoresAsignados(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing:'border-box' }} placeholder="Ej. Oskar" required />
            <datalist id="lista-prestadores">
              {listaPrestadores.map((prestador) => (
                <option key={prestador.id} value={prestador.nombre} />
              ))}
            </datalist>
          </div>

          <div>
            <label>Lugar / Equipo (Ej. Salón 101):</label>
            <input type="text" value={donde} onChange={(e) => setDonde(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing:'border-box' }} required />
          </div>

          <div>
            <label>Tipo de Reporte / Problema:</label>
            <input type="text" value={reporte} onChange={(e) => setReporte(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing:'border-box' }} placeholder="Ej. Proyector no da video..." required />
          </div>

          <div>
            <label>Resultado:</label>
            <select value={resultado} onChange={(e) => setResultado(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing:'border-box' }}>
              <option value="Exitoso">Exitoso</option>
              <option value="Pendiente">Pendiente</option>
              <option value="No Resuelto">No Resuelto</option>
            </select>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label>Comentarios / Solución aplicada:</label>
            <textarea value={comentarios} onChange={(e) => setComentarios(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', height: '60px', boxSizing:'border-box' }} required />
          </div>
          
          <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
            <button type="submit" disabled={isLoading} style={{ padding: '10px 20px', backgroundColor: GUINDA_IPN, color: 'white', border: 'none', borderRadius: '4px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
              {isLoading ? 'Guardando...' : 'Guardar en Bitácora'}
            </button>
          </div>
        </form>
      </div>

      {/* --- PANEL DE FILTROS --- */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#eef2f5', borderRadius: '8px', border: '1px solid #cdd5dc' }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#444' }}>🔍 Buscar y Filtrar</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          <input type="date" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} title="Filtrar por fecha" style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
          <input type="text" list="lista-prestadores-filtro" placeholder="👤 Atendido por..." value={filtroPrestador} onChange={(e) => setFiltroPrestador(e.target.value)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }} />
          <datalist id="lista-prestadores-filtro">
            {listaPrestadores.map((prestador) => (
              <option key={prestador.id} value={prestador.nombre} />
            ))}
          </datalist>
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

      {/* --- TABLA DE RESULTADOS --- */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr style={{ backgroundColor: '#636569', color: 'white', textAlign: 'left' }}>
            <th style={{ padding: '10px' }}>Fecha</th>
            <th style={{ padding: '10px' }}>Hora</th> {/* NUEVA COLUMNA */}
            <th style={{ padding: '10px' }}>Atendido Por</th>
            <th style={{ padding: '10px' }}>Lugar</th>
            <th style={{ padding: '10px' }}>Problema</th>
            <th style={{ padding: '10px' }}>Resultado</th>
            <th style={{ padding: '10px' }}>Comentarios</th>
          </tr>
        </thead>
        <tbody>
          {registrosFiltrados.length > 0 ? (
            registrosFiltrados.map((reg) => (
              <tr key={reg.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px' }}>{new Date(reg.fecha).toLocaleDateString()}</td>
                
                {/* Imprimimos la hora en la tabla */}
                <td style={{ padding: '10px', color: '#555' }}>{reg.hora || '--:--'}</td>
                
                <td style={{ padding: '10px', color: '#0055a4', fontWeight: 'bold' }}>{reg.prestadores_asignados || 'N/A'}</td>
                <td style={{ padding: '10px', fontWeight: 'bold' }}>{reg.donde}</td>
                <td style={{ padding: '10px' }}>{reg.reporte}</td>
                <td style={{ padding: '10px' }}>
                  <span style={{ color: reg.resultado === 'Exitoso' ? 'green' : reg.resultado === 'Pendiente' ? '#ff9800' : 'red', fontWeight: 'bold' }}>
                    {reg.resultado}
                  </span>
                </td>
                <td style={{ padding: '10px' }}>{reg.comentarios}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                No se encontraron registros que coincidan con los filtros.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#666', textAlign: 'right' }}>
        Mostrando {registrosFiltrados.length} de {registros.length} registros totales.
      </div>
    </div>
  );
};

export default Bitacora;