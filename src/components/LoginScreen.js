import React, { useState, useEffect, useRef } from 'react';

const GUINDA_IPN = '#750946';

const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- LÓGICA DEL CAPTCHA VISUAL (CANVAS) ---
  const canvasRef = useRef(null);
  const [captchaTextoReal, setCaptchaTextoReal] = useState('');
  const [respuestaUsuario, setRespuestaUsuario] = useState('');
  const [captchaValido, setCaptchaValido] = useState(false);

  const generarCaptchaVisual = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Limpiar el canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Fondo gris claro
    ctx.fillStyle = '#f2f2f2';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Caracteres permitidos (quitamos O, 0, I, l, 1 para evitar confusiones visuales)
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let textoGenerado = '';

    // Generar 6 caracteres aleatorios con rotación y distorsión
    for (let i = 0; i < 6; i++) {
      const char = caracteres.charAt(Math.floor(Math.random() * caracteres.length));
      textoGenerado += char;
      
      // Estilos aleatorios para cada letra
      ctx.font = `${Math.floor(Math.random() * 10) + 20}px Arial, sans-serif`; // Tamaño entre 20 y 30
      ctx.fillStyle = `#${Math.floor(Math.random()*16777215).toString(16)}`; // Color aleatorio oscuro
      
      // Rotación aleatoria
      ctx.save();
      ctx.translate(20 + i * 25, 30);
      ctx.rotate((Math.random() - 0.5) * 0.4); // Rotación entre -0.2 y 0.2 radianes
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }

    // Agregar "Ruido" (Líneas que atraviesan el texto para confundir a los bots)
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.strokeStyle = `rgba(0,0,0, ${Math.random()})`; // Líneas semi-transparentes
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    setCaptchaTextoReal(textoGenerado);
    setRespuestaUsuario('');
    setCaptchaValido(false);
  };

  // Se genera el primer CAPTCHA al cargar la pantalla
  useEffect(() => {
    generarCaptchaVisual();
  }, []);

  const handleCaptchaChange = (e) => {
    const valor = e.target.value;
    setRespuestaUsuario(valor);
    // Validación (Hacemos que no sea sensible a mayúsculas/minúsculas para mejor UX)
    if (valor.toLowerCase() === captchaTextoReal.toLowerCase()) {
      setCaptchaValido(true);
    } else {
      setCaptchaValido(false);
    }
  };
  // ------------------------------------------

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!captchaValido) {
      return alert("El código CAPTCHA no coincide. Inténtalo de nuevo.");
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('userName', data.nombre);
        localStorage.setItem('userRole', data.role);
        
        // TRUCO PROFESIONAL: Revisamos si onLogin existe. Si no, recargamos la página.
        setTimeout(() => {
          if (typeof onLogin === 'function') {
            onLogin(data.role); 
          } else {
            window.location.reload(); // Esto hace el "F5" automático por ti
          }
        }, 100);
        
        return; 
      } else {
        setErrorMsg(data.message);
        generarCaptchaVisual(); 
        setPassword('');
        setIsLoading(false); 
      }
    } catch (error) {
      console.error("Error detectado en Login:", error); 
      setErrorMsg("Error de conexión con el servidor.");
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', textAlign: 'center', backgroundColor: '#fff' }}>
      <h2 style={{ color: GUINDA_IPN }}>UDI-SISS | Iniciar Sesión</h2>
      
      {errorMsg && <div style={{ color: 'red', backgroundColor: '#ffe6e6', padding: '10px', marginBottom: '15px', borderRadius: '4px' }}>{errorMsg}</div>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px', textAlign: 'left' }}>
          <label>Correo Electrónico:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }} required />
        </div>

        <div style={{ marginBottom: '15px', textAlign: 'left' }}>
          <label>Contraseña:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%', padding: '8px', marginTop: '5px', boxSizing: 'border-box' }} required />
        </div>

        {/* --- INTERFAZ DEL CAPTCHA VISUAL --- */}
        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#fafafa', border: '1px solid #ddd', borderRadius: '4px', textAlign: 'center' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#333' }}>Escribe los caracteres de la imagen:</label>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative' }}>
              <canvas ref={canvasRef} width="180" height="50" style={{ border: '1px solid #ccc', borderRadius: '4px', letterSpacing: '2px' }}></canvas>
              {/* Botón para recargar el CAPTCHA si el usuario no le entiende */}
              <button type="button" onClick={generarCaptchaVisual} style={{ position: 'absolute', right: '-35px', top: '10px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }} title="Cambiar imagen">
                🔄
              </button>
            </div>

            <input type="text" value={respuestaUsuario} onChange={handleCaptchaChange} maxLength="6" placeholder="Ingresa el código" style={{ width: '150px', padding: '8px', textAlign: 'center', textTransform: 'uppercase', border: captchaValido ? '2px solid green' : '1px solid #ccc' }} required />
            
            {respuestaUsuario.length > 0 && (
              <span style={{ color: captchaValido ? 'green' : 'red', fontWeight: 'bold', fontSize: '0.9rem' }}>
                {captchaValido ? '✓ Código Correcto' : '✗ Código Incorrecto'}
              </span>
            )}
          </div>
        </div>
        {/* ----------------------------- */}

        <button type="submit" disabled={isLoading || !captchaValido} style={{ width: '100%', padding: '12px', backgroundColor: captchaValido ? GUINDA_IPN : '#ccc', color: 'white', border: 'none', borderRadius: '4px', cursor: captchaValido ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '1rem' }}>
          {isLoading ? 'Verificando...' : 'Entrar al Sistema'}
        </button>
      </form>
    </div>
  );
};

export default LoginScreen;