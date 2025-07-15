import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Clear form when coming from logout
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('logout') === 'true') {
      setEmail('');
      setPassword('');
      setError(null);
    }
  }, [location.search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await login(email, password);
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Handle specific error messages
      if (error.message) {
        setError(error.message);
      } else {
        setError('Error al iniciar sesión. Por favor, verifica tus credenciales.');
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
          <p className="text-white/80 text-xs sm:text-sm lg:text-base">Inicia sesión para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 lg:space-y-6">
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
                : 'bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 transform hover:scale-105'
              }
              text-white shadow-lg
            `}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white"></div>
                <span>Iniciando sesión...</span>
              </div>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>

        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-white/80 text-xs sm:text-sm lg:text-base">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-primary-400 hover:text-primary-300 underline">
              Regístrate aquí
            </Link>
          </p>
        </div>

        <div className="mt-4 sm:mt-6 lg:mt-8 text-center">
          <Link to="/" className="text-white/60 hover:text-white/80 text-xs sm:text-sm">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginForm; 