import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';

const GUINDA_IPN = '#750946';

const Evidencias = () => {
  const [foto, setFoto] = useState(null);
  const [descripcion, setDescripcion] = useState('');
  const [evidenciasSubidas, setEvidenciasSubidas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const nombreUsuario = localStorage.getItem('userName');

  const cargarEvidencias = useCallback(async () => {
    try {
      const url = 'http://localhost:5000/api/evidencias';
      const res = await fetch(url);
      const data = await res.json();
      setEvidenciasSubidas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error al cargar evidencias");
    }
  }, []); 

  useEffect(() => {
    cargarEvidencias();
  }, [cargarEvidencias]);

  const handleSubir = async (e) => {
    e.preventDefault();
    if (!foto) return toast.warning("Selecciona una fotografía.");

    // VALIDACIÓN DE PESO (Máximo 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (foto.size > MAX_FILE_SIZE) {
      return toast.warning("La imagen es demasiado pesada (Máximo 5MB).");
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('foto', foto);
    formData.append('usuario_nombre', nombreUsuario);
    formData.append('descripcion', descripcion);

    try {
      const respuesta = await fetch('http://localhost:5000/api/evidencias', {
        method: 'POST',
        body: formData
      });
      const data = await respuesta.json();

      if (respuesta.ok && data.success) {
        toast.success("¡Fotografía guardada!");
        setFoto(null);
        setDescripcion('');
        e.target.reset();
        cargarEvidencias();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Error de red.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ textAlign: 'left' }}>
      <h3 style={{ color: GUINDA_IPN }}>Evidencias Fotográficas</h3>
      
      <div style={{ marginBottom: '40px', border: '1px solid #ccc', padding: '20px', borderRadius: '8px', backgroundColor: '#fdfdfd' }}>
        <form onSubmit={handleSubir}>
          <label>Descripción de la actividad:</label>
          <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} style={{ width: '100%', height: '60px', marginTop: '10px', padding: '8px', boxSizing: 'border-box' }} required />
          
          <label style={{ display: 'block', marginTop: '15px' }}>Seleccionar Imagen (Máx. 5MB):</label>
          <input type="file" accept="image/*" onChange={(e) => setFoto(e.target.files[0])} style={{ margin: '10px 0 20px 0' }} required />
          
          <button type="submit" disabled={isLoading} style={{ padding: '10px 20px', backgroundColor: GUINDA_IPN, color: 'white', border: 'none', borderRadius: '4px', cursor: isLoading ? 'not-allowed' : 'pointer' }}>
            {isLoading ? 'Subiendo...' : 'Registrar Evidencia'}
          </button>
        </form>
      </div>

      <h4>Galería de Evidencias</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px', marginTop: '15px' }}>
        
        {Array.isArray(evidenciasSubidas) && evidenciasSubidas.map((evi) => (
          <div key={evi.id} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '8px', textAlign: 'center', backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            
            <img 
              src={`http://localhost:5000/uploads/${evi.nombre_archivo}`} 
              alt="Evidencia subida" 
              style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '4px', marginBottom: '10px' }} 
              onError={(e) => e.target.src = 'https://via.placeholder.com/150?text=Error+al+cargar'} 
            />
            
            <p style={{ fontSize: '0.8rem', color: '#666', margin: '5px 0' }}>{new Date(evi.fecha_subida).toLocaleDateString()}</p>
            <p style={{ fontWeight: 'bold', margin: '5px 0' }}>{evi.descripcion}</p>
            <span style={{ fontSize: '0.7rem', color: GUINDA_IPN }}>{evi.usuario_nombre}</span>
            
          </div>
        ))}

        {evidenciasSubidas.length === 0 && (
          <p style={{ color: '#666', gridColumn: '1 / -1', padding: '20px', textAlign: 'center', backgroundColor: '#fcfcfc', borderRadius: '8px', border: '1px solid #eee' }}>No hay fotografías registradas todavía.</p>
        )}
        
      </div>
    </div>
  );
};

export default Evidencias;