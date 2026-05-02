import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

const GUINDA_IPN = '#750946';

const Materiales = () => {
  // Estados de Formulario
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState('Manuales');
  const [linkUrl, setLinkUrl] = useState('');
  const [archivo, setArchivo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Estados Globales
  const [materiales, setMateriales] = useState([]);
  const [filtroCategoria, setFiltroCategoria] = useState('Todas');
  
  // Variables del usuario actual
  const rolUsuario = localStorage.getItem('userRole') || 'Prestador de Servicio';
  const nombreUsuario = localStorage.getItem('userName') || 'Usuario';

  const cargarMateriales = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/materiales/${rolUsuario}/${nombreUsuario}`);
      const data = await res.json();
      setMateriales(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error("Error al cargar los materiales.");
    }
  }, [rolUsuario, nombreUsuario]);

  useEffect(() => {
    cargarMateriales();
  }, [cargarMateriales]);

  const handleSubir = async (e) => {
    e.preventDefault();
    
    // Validaciones de seguridad
    if (categoria === 'Instaladores' && !linkUrl) {
      return toast.warning("Debes proporcionar un link válido para el instalador.");
    }
    if (categoria !== 'Instaladores' && !archivo) {
      return toast.warning("Debes seleccionar un archivo para subir.");
    }

    setIsLoading(true);
    const tipoRecurso = categoria === 'Instaladores' ? 'Link' : 'Archivo';

    // Como mandamos archivos físicos, necesitamos usar FormData en lugar de JSON
    const formData = new FormData();
    formData.append('titulo', titulo);
    formData.append('categoria', categoria);
    formData.append('tipo_recurso', tipoRecurso);
    formData.append('subido_por', nombreUsuario);
    formData.append('rol_usuario', rolUsuario);
    
    if (tipoRecurso === 'Link') {
      formData.append('link_url', linkUrl);
    } else {
      formData.append('archivo', archivo);
    }

    try {
      const respuesta = await fetch('http://localhost:5000/api/materiales', {
        method: 'POST',
        body: formData // fetch automáticamente pone el Content-Type correcto para FormData
      });
      const data = await respuesta.json();

      if (respuesta.ok && data.success) {
        toast.success(rolUsuario === 'Jefe de UDI' ? "¡Material publicado!" : "Material enviado a revisión.");
        setTitulo(''); setLinkUrl(''); setArchivo(null);
        // Reseteamos el input de archivo visualmente
        document.getElementById('input-archivo').value = '';
        cargarMateriales();
      } else {
        toast.error(`Error: ${data.message}`);
      }
    } catch (error) {
      toast.error("Error de red al intentar subir el material.");
    } finally {
      setIsLoading(false);
    }
  };

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      const respuesta = await fetch(`http://localhost:5000/api/materiales/${id}/estado`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevoEstado, revisado_por: nombreUsuario })
      });
      const data = await respuesta.json();

      if (respuesta.ok && data.success) {
        toast.success(data.message);
        cargarMateriales();
      } else {
        toast.error("Error al actualizar el estado.");
      }
    } catch (error) {
      toast.error("Error de red.");
    }
  };

  // Filtrado de tarjetas
  const materialesFiltrados = filtroCategoria === 'Todas' 
    ? materiales 
    : materiales.filter(m => m.categoria === filtroCategoria);

  // Selector de Iconos para hacerlo visual
  const getIcono = (cat) => {
    switch(cat) {
      case 'Instaladores': return '💻';
      case 'Manuales': return '📘';
      case 'Archivos de consulta': return '📊';
      case 'Fondos de Pantalla': return '🖼️';
      default: return '📁';
    }
  };

  return (
    <div style={{ textAlign: 'left' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: GUINDA_IPN, margin: 0 }}>Repositorio de Materiales UDI</h3>
      </div>

      {/* ZONA DE SUBIDA */}
      <div style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '20px', borderRadius: '8px', backgroundColor: '#fdfdfd' }}>
        <h4 style={{ marginTop: 0, color: '#333' }}>+ Aportar Material</h4>
        <form onSubmit={handleSubir} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <label>Título del Material (Ej. Instalador de NetBeans 15):</label>
            <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing:'border-box' }} required />
          </div>

          <div>
            <label>Categoría:</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing:'border-box', border: '1px solid #ccc', borderRadius: '4px' }}>
              <option value="Manuales">📘 Manuales (PDF)</option>
              <option value="Instaladores">💻 Instaladores (.exe/.iso vía Link)</option>
              <option value="Archivos de consulta">📊 Archivos de Consulta (Excel/Word)</option>
              <option value="Fondos de Pantalla">🖼️ Fondos de Pantalla (JPG/PNG)</option>
            </select>
          </div>

          {/* INPUT DINÁMICO: Si es Instalador pide Link, si es otro pide Archivo */}
          <div>
            {categoria === 'Instaladores' ? (
              <>
                <label>Link de Descarga Segura (Google Drive, Mega):</label>
                <input type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing:'border-box' }} required />
              </>
            ) : (
              <>
                <label>Seleccionar Archivo (Máx 5MB):</label>
                <input id="input-archivo" type="file" onChange={(e) => setArchivo(e.target.files[0])} accept={categoria === 'Fondos de Pantalla' ? 'image/*' : '.pdf,.xlsx,.docx'} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing:'border-box' }} required />
              </>
            )}
          </div>
          
          <div style={{ gridColumn: '1 / -1', textAlign: 'right' }}>
            <button type="submit" disabled={isLoading} style={{ padding: '10px 20px', backgroundColor: GUINDA_IPN, color: 'white', border: 'none', borderRadius: '4px', cursor: isLoading ? 'not-allowed' : 'pointer', fontWeight: 'bold' }}>
              {isLoading ? 'Subiendo...' : (rolUsuario === 'Jefe de UDI' ? 'Publicar Directo' : 'Enviar a Revisión')}
            </button>
          </div>
        </form>
      </div>

      {/* FILTROS Y GRID DE MATERIALES */}
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ color: '#444' }}>📚 Explorar Repositorio</h4>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
          {['Todas', 'Manuales', 'Instaladores', 'Archivos de consulta', 'Fondos de Pantalla'].map(cat => (
            <button 
              key={cat} 
              onClick={() => setFiltroCategoria(cat)}
              style={{ 
                padding: '8px 15px', borderRadius: '20px', border: `1px solid ${GUINDA_IPN}`, cursor: 'pointer', fontWeight: 'bold',
                backgroundColor: filtroCategoria === cat ? GUINDA_IPN : 'white',
                color: filtroCategoria === cat ? 'white' : GUINDA_IPN
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* GRID DE TARJETAS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {materialesFiltrados.length > 0 ? materialesFiltrados.map((mat) => (
            <div key={mat.id} style={{ border: '1px solid #e0e0e0', borderRadius: '10px', padding: '20px', backgroundColor: 'white', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', position: 'relative' }}>
              
              {/* Badge de Estado */}
              <div style={{ position: 'absolute', top: '15px', right: '15px', fontSize: '0.75rem', fontWeight: 'bold', padding: '4px 8px', borderRadius: '12px',
                backgroundColor: mat.estado === 'Aprobado' ? '#e8f5e9' : mat.estado === 'Pendiente' ? '#fff3e0' : '#ffebee',
                color: mat.estado === 'Aprobado' ? 'green' : mat.estado === 'Pendiente' ? '#ff9800' : 'red'
              }}>
                {mat.estado}
              </div>

              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>{getIcono(mat.categoria)}</div>
              <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>{mat.titulo}</h4>
              <p style={{ margin: '0 0 15px 0', fontSize: '0.85rem', color: '#666' }}>Subido por: <b>{mat.subido_por}</b></p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Botón Descargar/Visitar */}
                {mat.estado === 'Aprobado' || rolUsuario === 'Jefe de UDI' ? (
                  <a 
                    href={mat.tipo_recurso === 'Link' ? mat.ruta_archivo : `http://localhost:5000/uploads/${mat.ruta_archivo}`} 
                    target="_blank" rel="noopener noreferrer"
                    style={{ textAlign: 'center', display: 'block', padding: '10px', backgroundColor: '#eef2f5', color: '#0055a4', textDecoration: 'none', borderRadius: '6px', fontWeight: 'bold', border: '1px solid #cdd5dc' }}
                  >
                    {mat.tipo_recurso === 'Link' ? '🔗 Abrir Enlace' : '⬇️ Descargar Archivo'}
                  </a>
                ) : (
                  <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f5f5f5', color: '#999', borderRadius: '6px', fontSize: '0.85rem' }}>
                    Bloqueado hasta aprobación
                  </div>
                )}

                {/* Controles de Jefe para aprobar/rechazar */}
                {rolUsuario === 'Jefe de UDI' && mat.estado === 'Pendiente' && (
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <button onClick={() => cambiarEstado(mat.id, 'Aprobado')} style={{ flex: 1, padding: '8px', backgroundColor: '#2e7d32', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>✓ Aprobar</button>
                    <button onClick={() => cambiarEstado(mat.id, 'Rechazado')} style={{ flex: 1, padding: '8px', backgroundColor: '#d32f2f', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>X Rechazar</button>
                  </div>
                )}
              </div>

            </div>
          )) : (
            <p style={{ color: '#666', gridColumn: '1 / -1' }}>No hay materiales en esta categoría aún.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Materiales;