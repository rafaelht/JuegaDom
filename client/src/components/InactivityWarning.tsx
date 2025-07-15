import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

const InactivityWarning: React.FC = () => {
  const { logout } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds warning
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    
    const startInactivityTimer = () => {
      // Show warning 1 minute before logout
      inactivityTimer = setTimeout(() => {
        setShowWarning(true);
        setTimeLeft(60);
        
        // Start countdown
        countdownTimerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              logout();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, 14 * 60 * 1000); // 14 minutes (1 minute before 15-minute timeout)
    };

    const handleUserActivity = () => {
      // Clear existing timers
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
      
      // Hide warning if it was showing
      setShowWarning(false);
      setTimeLeft(60);
      
      // Restart inactivity timer
      startInactivityTimer();
    };

    // Events to track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, true);
    });

    // Start the initial timer
    startInactivityTimer();

    // Cleanup function
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity, true);
      });
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    };
  }, [logout]);

  const handleStayLoggedIn = () => {
    setShowWarning(false);
    setTimeLeft(60);
  };

  const handleLogoutNow = () => {
    logout();
  };

  if (!showWarning) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md">
        <div className="text-center">
          <div className="text-yellow-400 text-4xl mb-4">⚠️</div>
          <h3 className="text-white font-bold text-lg sm:text-xl mb-2">
            Sesión por expirar
          </h3>
          <p className="text-white/80 text-sm sm:text-base mb-4">
            Tu sesión se cerrará automáticamente en:
          </p>
          <div className="text-2xl sm:text-3xl font-bold text-red-400 mb-6">
            {timeLeft} segundos
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleStayLoggedIn}
              className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base min-h-[44px]"
            >
              Mantener sesión
            </button>
            <button
              onClick={handleLogoutNow}
              className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base min-h-[44px]"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InactivityWarning; 