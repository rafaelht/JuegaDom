import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const RegisterForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Standard validations
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Por favor, ingresa un email válido');
      setLoading(false);
      return;
    }

    // Username validation
    if (username.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres');
      setLoading(false);
      return;
    }

    if (username.length > 20) {
      setError('El nombre de usuario no puede tener más de 20 caracteres');
      setLoading(false);
      return;
    }

    try {
      await register(username, email, password);
      navigate('/');
    } catch (error: any) {
      // Handle specific error messages
      if (error.message) {
        setError(error.message);
      } else {
        setError('Error al registrarse. Por favor, intenta de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4 lg:p-6">
      <div className="glass rounded-2xl p-4 sm:p-6 lg:p-8 w-full max-w-sm sm:max-w-md mx-auto">
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">🎲 JuegaDom</h1>
          <p className="text-white/80 text-xs sm:text-sm lg:text-base">Crea tu cuenta para comenzar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 lg:space-y-6">
          <div>
            <label htmlFor="username" className="block text-white font-medium mb-2 text-xs sm:text-sm lg:text-base">
              Nombre de Usuario
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base min-h-[44px]"
              placeholder="Tu nombre de usuario"
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-white font-medium mb-2 text-xs sm:text-sm lg:text-base">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base min-h-[44px]"
              placeholder="tu@email.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-white font-medium mb-2 text-xs sm:text-sm lg:text-base">
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base min-h-[44px]"
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <p className="text-white/60 text-xs sm:text-sm mt-1">Mínimo 6 caracteres</p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-white font-medium mb-2 text-xs sm:text-sm lg:text-base">
              Confirmar Contraseña
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 sm:px-4 py-3 sm:py-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base min-h-[44px]"
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="p-3 sm:p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
              <p className="text-red-200 text-center text-xs sm:text-sm lg:text-base">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`
              w-full py-3 sm:py-4 rounded-lg font-semibold transition-all duration-300 text-sm sm:text-base min-h-[48px] sm:min-h-[52px]
              ${loading
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-lottery-green to-green-500 hover:from-green-500 hover:to-green-600 transform hover:scale-105'
              }
              text-white shadow-lg
            `}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                <span>Creando cuenta...</span>
              </div>
            ) : (
              'Crear Cuenta'
            )}
          </button>
        </form>

        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-white/80 text-xs sm:text-sm lg:text-base">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 underline">
              Inicia sesión aquí
            </Link>
          </p>
        </div>

        <div className="mt-4 sm:mt-6 lg:mt-8 text-center">
          <p className="text-white/60 text-xs">
            Al registrarte, aceptas nuestros{' '}
            <Link to="/terms" className="text-primary-400 hover:text-primary-300 underline">
              Términos de Servicio
            </Link>{' '}
            y{' '}
            <Link to="/privacy" className="text-primary-400 hover:text-primary-300 underline">
              Política de Privacidad
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm; 