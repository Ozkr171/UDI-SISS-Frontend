import React, { useState } from 'react';

const GUINDA_IPN = '#750946';

const RegistrarUsuario = () => {
  const [formData, setFormData] = useState({
    nombre: '', correo: '', password: '', boleta: '', fechaNacimiento: '', horario: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const respuesta = await fetch('http://localhost:5000/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await respuesta.json();

      if (data.success) {
        alert('Usuario registrado con éxito en la Base de Datos: ' + formData.nombre);
        // Limpiamos el formulario
        setFormData({ nombre: '', correo: '', password: '', boleta: '', fechaNacimiento: '', horario: '' });
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      alert('Error de conexión con el servidor.');
    }
  };

  const inputStyle = { width: '100%', padding: '8px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '4px', boxSizing: 'border-box' };

  return (
    <div style={{ textAlign: 'left', maxWidth: '500px', margin: '0 auto' }}>
      <h3 style={{ color: GUINDA_IPN }}>Registrar Nuevo Prestador</h3>
      <form onSubmit={handleSubmit}>
        <label>Nombre Completo:</label>
        <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} style={inputStyle} required />

        <label>Número de Boleta:</label>
        <input type="text" name="boleta" value={formData.boleta} onChange={handleChange} style={inputStyle} required />

        <label>Fecha de Nacimiento:</label>
        <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} style={inputStyle} required />

        <label>Horario Asignado:</label>
        <input type="text" name="horario" placeholder="Ej. Lunes a Viernes 10:00 - 14:00" value={formData.horario} onChange={handleChange} style={inputStyle} required />

        <label>Correo Institucional:</label>
        <input type="email" name="correo" value={formData.correo} onChange={handleChange} style={inputStyle} required />

        <label>Contraseña temporal:</label>
        <input type="password" name="password" value={formData.password} onChange={handleChange} style={inputStyle} required />

        <button type="submit" style={{ width: '100%', padding: '10px', backgroundColor: GUINDA_IPN, color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
          Registrar Usuario
        </button>
      </form>
    </div>
  );
};

export default RegistrarUsuario;