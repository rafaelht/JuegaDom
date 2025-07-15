import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      setError('Enlace de verificación inválido');
      setLoading(false);
      return;
    }

    verifyEmail();
  }, [token, email]);

  const verifyEmail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email!)}`);
      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Error al verificar email');
      }
    } catch (error) {
      setError('Error de conexión. Por favor, intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!email) return;

    try {
      setResending(true);
      setError(null);

      const response = await authAPI.resendVerification({ email });
      alert('Email de verificación reenviado exitosamente. Revisa tu bandeja de entrada.');
    } catch (error: any) {
      setError(error.response?.data?.error || 'Error al reenviar email');
    } finally {
      setResending(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-3 sm:p-4 lg:p-6">
        <div className="glass rounded-2xl p-4 sm:p-6 lg:p-8 w-full max-w-sm sm:max-w-md mx-auto text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Verificando tu email...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-4xl mx-auto p-3 sm:p-4 lg:p-6">
        <div className="glass rounded-2xl p-4 sm:p-6 lg:p-8 w-full max-w-sm sm:max-w-md mx-auto text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✅</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4">
              ¡Email Verificado!
            </h1>
            <p className="text-white/80 text-sm sm:text-base mb-6">
              Tu cuenta ha sido verificada exitosamente. Ya puedes usar todas las funciones de JuegaDom.
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 sm:py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg font-semibold transition-all duration-300 hover:from-primary-700 hover:to-primary-800 transform hover:scale-105"
            >
              🎲 Ir a Generar Números
            </button>
            
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 sm:py-4 bg-white/10 text-white rounded-lg font-semibold transition-all duration-300 hover:bg-white/20"
            >
              🔑 Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4 lg:p-6">
      <div className="glass rounded-2xl p-4 sm:p-6 lg:p-8 w-full max-w-sm sm:max-w-md mx-auto text-center">
        <div className="mb-6">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">❌</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4">
            Error de Verificación
          </h1>
          <p className="text-white/80 text-sm sm:text-base mb-6">
            {error || 'No se pudo verificar tu email. El enlace puede haber expirado o ser inválido.'}
          </p>
        </div>

        <div className="space-y-3">
          {email && (
            <button
              onClick={resendVerification}
              disabled={resending}
              className={`w-full py-3 sm:py-4 rounded-lg font-semibold transition-all duration-300 ${
                resending
                  ? 'bg-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-lottery-green to-green-500 hover:from-green-500 hover:to-green-600 transform hover:scale-105'
              } text-white`}
            >
              {resending ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Reenviando...</span>
                </div>
              ) : (
                '📧 Reenviar Email de Verificación'
              )}
            </button>
          )}
          
          <button
            onClick={() => navigate('/login')}
            className="w-full py-3 sm:py-4 bg-white/10 text-white rounded-lg font-semibold transition-all duration-300 hover:bg-white/20"
          >
            🔑 Ir al Login
          </button>
          
          <button
            onClick={() => navigate('/')}
            className="w-full py-3 sm:py-4 bg-white/10 text-white rounded-lg font-semibold transition-all duration-300 hover:bg-white/20"
          >
            🏠 Volver al Inicio
          </button>
        </div>

        <div className="mt-6 p-3 sm:p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
          <p className="text-blue-200 text-xs sm:text-sm">
            💡 <strong>Consejo:</strong> Revisa tu carpeta de spam si no encuentras el email de verificación.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification; 