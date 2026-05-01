import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';

const GUINDA_IPN = '#750946';

const LoginScreen = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Estados del CAPTCHA
  const canvasRef = useRef(null);
  const [captchaTextoReal, setCaptchaTextoReal] = useState('');
  const [respuestaUsuario, setRespuestaUsuario] = useState('');
  const [captchaValido, setCaptchaValido] = useState(false);

  // Lógica de dibujo del CAPTCHA
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
      ctx.fillStyle = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
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

  useEffect(() => {
    generarCaptchaVisual();
  }, [generarCaptchaVisual]);

  const handleCaptchaChange = (e) => {
    const valor = e.target.value;
    setRespuestaUsuario(valor);
    if (valor.toLowerCase() === captchaTextoReal.toLowerCase()) {
      setCaptchaValido(true);
    } else {
      setCaptchaValido(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!captchaValido) {
      return toast.warning("Por favor, resuelve el CAPTCHA correctamente.");
    }

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        onLogin(data.role, data.nombre);
      } else {
        toast.error(data.message || "Correo o contraseña incorrectos");
        generarCaptchaVisual(); // Reiniciamos el captcha si se equivocó
      }
    } catch (error) {
      toast.error("Error al conectar con el servidor.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecuperarPassword = async () => {
    if (!email) {
      return toast.warning("Ingresa tu correo electrónico arriba para poder enviarte una contraseña temporal.");
    }
    
    const confirmacion = window.confirm(`¿Enviar contraseña temporal al correo ${email}?`);
    if (!confirmacion) return;

    try {
      const response = await fetch('http://localhost:5000/api/recuperar-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();

      if (response.ok && data.success) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Error al conectar con el servidor.");
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#eef2f5', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      
      {/* CONTENEDOR PRINCIPAL TIPO TARJETA GIGANTE */}
      <div style={{ display: 'flex', flexDirection: 'row', width: '100%', maxWidth: '900px', backgroundColor: 'white', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', overflow: 'hidden', flexWrap: 'wrap' }}>
        
        {/* MITAD IZQUIERDA - BRANDING Y LOGO */}
        <div style={{ flex: '1 1 400px', backgroundColor: GUINDA_IPN, color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '40px', textAlign: 'center' }}>
          
          {/* Aquí mandamos a llamar tu imagen desde la carpeta public */}
          <img 
            src="/logo-sigess.jpg" 
            alt="Logo SIGESS-UDI" 
            style={{ width: '220px', height: '220px', objectFit: 'cover', borderRadius: '50%', marginBottom: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)', border: '4px solid white' }} 
            onError={(e) => e.target.style.display = 'none'} // Si te equivocas de nombre, se oculta para no verse feo
          />
          
          <h1 style={{ margin: 0, fontSize: '2.5rem', letterSpacing: '2px' }}>SIGESS</h1>
          <h2 style={{ margin: '5px 0 20px 0', fontWeight: '300', fontSize: '1.5rem' }}>UDI</h2>
          <div style={{ width: '50px', height: '3px', backgroundColor: 'white', marginBottom: '20px' }}></div>
          <p style={{ fontSize: '0.95rem', opacity: 0.9, lineHeight: '1.5', maxWidth: '80%' }}>
            Sistema Integral de Gestión de Servicio Social de la Unidad de Informática
          </p>
        </div>

        {/* MITAD DERECHA - FORMULARIO DE LOGIN */}
        <div style={{ flex: '1 1 400px', padding: '40px 50px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          
          <h3 style={{ color: '#333', fontSize: '1.5rem', marginBottom: '30px', textAlign: 'center' }}>Iniciar Sesión</h3>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontWeight: 'bold', fontSize: '0.9rem' }}>Correo Electrónico:</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="ejemplo@ipn.mx"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box', fontSize: '1rem' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontWeight: 'bold', fontSize: '0.9rem' }}>Contraseña:</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="••••••••"
                style={{ width: '100%', padding: '10px 12px', border: '1px solid #ccc', borderRadius: '6px', boxSizing: 'border-box', fontSize: '1rem' }}
              />
              <div style={{ textAlign: 'right', marginTop: '5px' }}>
                <button type="button" onClick={handleRecuperarPassword} style={{ background: 'none', border: 'none', color: '#0055a4', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            </div>

            {/* SECCIÓN DEL CAPTCHA */}
            <div style={{ padding: '15px', backgroundColor: '#f9f9f9', border: '1px solid #e0e0e0', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
              <span style={{ fontSize: '0.85rem', color: '#666' }}>Escribe los caracteres de la imagen:</span>
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <canvas ref={canvasRef} width="160" height="45" style={{ border: '1px solid #ccc', borderRadius: '4px', backgroundColor: 'white' }}></canvas>
                <button type="button" onClick={generarCaptchaVisual} style={{ position: 'absolute', right: '-35px', top: '10px', background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }} title="Cambiar imagen">
                  🔄
                </button>
              </div>
              <input 
                type="text" 
                value={respuestaUsuario} 
                onChange={handleCaptchaChange} 
                maxLength="6" 
                required 
                placeholder="INGRESA EL CÓDIGO"
                style={{ width: '160px', padding: '8px', textAlign: 'center', textTransform: 'uppercase', border: captchaValido ? '2px solid green' : '1px solid #ccc', borderRadius: '4px', outline: 'none' }} 
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading || !captchaValido}
              style={{ 
                marginTop: '15px', 
                padding: '12px', 
                backgroundColor: captchaValido ? GUINDA_IPN : '#ccc', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px', 
                cursor: captchaValido ? 'pointer' : 'not-allowed', 
                fontSize: '1rem', 
                fontWeight: 'bold',
                transition: 'background-color 0.3s'
              }}
            >
              {isLoading ? 'Verificando...' : 'Entrar al Sistema'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default LoginScreen;