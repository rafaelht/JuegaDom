import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navigation: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userMenuPosition, setUserMenuPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const navigate = useNavigate();
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      // Check if click is outside mobile menu but not on the mobile menu button
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        // Check if the click is not on the mobile menu button
        const target = event.target as HTMLElement;
        const mobileMenuButton = target.closest('.md\\:hidden button');
        if (!mobileMenuButton) {
          setIsMenuOpen(false);
        }
      }
    };

    if (isUserMenuOpen || isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen, isMenuOpen]);

  // Calculate user menu position when opened
  useEffect(() => {
    if (isUserMenuOpen && userButtonRef.current) {
      const rect = userButtonRef.current.getBoundingClientRect();
      setUserMenuPosition({
        top: rect.bottom + 8, // 8px margin
        left: rect.right - 192, // 192px = menu width
        width: rect.width
      });
    } else {
      setUserMenuPosition(null);
    }
  }, [isUserMenuOpen]);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    setIsMenuOpen(false);
  };

  const handleUserMenuToggle = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  // Portal for user menu
  const userMenuPortal = isUserMenuOpen && userMenuPosition
    ? ReactDOM.createPortal(
        <div
          className="user-menu-dropdown py-2"
          ref={userMenuRef}
          style={{
            position: 'fixed',
            top: userMenuPosition.top,
            left: userMenuPosition.left,
            minWidth: 192,
            zIndex: 9999
          }}
        >
          <Link
            to="/profile"
            className="block px-4 py-3 text-white hover:bg-white/10 transition-colors text-sm"
            onClick={() => setIsUserMenuOpen(false)}
          >
            👨‍💼 Mi Perfil
          </Link>
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-3 text-white hover:bg-white/10 transition-colors text-sm"
          >
            <span className="text-red-400">➡️</span> Cerrar Sesión
          </button>
        </div>,
        document.body
      )
    : null;

  return (
    <nav className="glass rounded-b-2xl mb-2">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 min-h-[44px] min-w-[44px] flex items-center">
            <span className="text-lg sm:text-xl lg:text-2xl">🎲</span>
            <span className="text-white font-bold text-base sm:text-lg lg:text-xl">JuegaDom</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link
              to="/"
              className="text-white/80 hover:text-white transition-colors text-sm lg:text-base px-3 py-2 rounded-lg hover:bg-white/10"
            >
              Generar
            </Link>
            
            {isAuthenticated && (
              <>
                <Link
                  to="/my-numbers"
                  className="text-white/80 hover:text-white transition-colors text-sm lg:text-base px-3 py-2 rounded-lg hover:bg-white/10"
                >
                  Mis Números
                </Link>
                <Link
                  to="/stats"
                  className="text-white/80 hover:text-white transition-colors text-sm lg:text-base px-3 py-2 rounded-lg hover:bg-white/10"
                >
                  Estadísticas
                </Link>
                {user?.is_admin && (
                  <Link
                    to="/admin"
                    className="text-white/80 hover:text-white transition-colors text-sm lg:text-base px-3 py-2 rounded-lg hover:bg-white/10"
                  >
                    Admin
                  </Link>
                )}
              </>
            )}
            
            <Link
              to="/about"
              className="text-white/80 hover:text-white transition-colors text-sm lg:text-base px-3 py-2 rounded-lg hover:bg-white/10"
            >
              Acerca de
            </Link>
          </div>

          {/* User Menu / Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3 lg:space-x-4">
            {isAuthenticated ? (
              <div className="relative z-[9998]">
                <button
                  ref={userButtonRef}
                  onClick={handleUserMenuToggle}
                  className="flex items-center space-x-2 text-white hover:text-white/80 transition-colors px-3 py-2 rounded-lg hover:bg-white/10 min-h-[44px]"
                >
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold">
                      {user?.username?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm lg:text-base">{user?.username}</span>
                </button>
                {userMenuPortal}
              </div>
            ) : (
              <div className="flex items-center space-x-3 lg:space-x-4">
                <Link
                  to="/login"
                  className="text-white/80 hover:text-white transition-colors text-sm lg:text-base px-3 py-2 rounded-lg hover:bg-white/10"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm lg:text-base min-h-[44px] flex items-center"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            {isMenuOpen ? (
              // X button when menu is open
              <button
                onClick={() => setIsMenuOpen(false)}
                className="text-white hover:text-white/80 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : (
              // Hamburger button when menu is closed
              <button
                onClick={() => setIsMenuOpen(true)}
                className="text-white hover:text-white/80 transition-colors p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Open menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-white/20" ref={mobileMenuRef}>
            <div className="space-y-1">
              <Link
                to="/"
                className="block px-4 py-4 text-white/80 hover:text-white transition-colors text-base rounded-lg hover:bg-white/10"
                onClick={() => setIsMenuOpen(false)}
              >
                🎲 Generar
              </Link>
              
              {isAuthenticated && (
                <>
                  <Link
                    to="/my-numbers"
                    className="block px-4 py-4 text-white/80 hover:text-white transition-colors text-base rounded-lg hover:bg-white/10"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    📋 Mis Números
                  </Link>
                  <Link
                    to="/stats"
                    className="block px-4 py-4 text-white/80 hover:text-white transition-colors text-base rounded-lg hover:bg-white/10"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    📊 Estadísticas
                  </Link>
                  {user?.is_admin && (
                    <Link
                      to="/admin"
                      className="block px-4 py-4 text-white/80 hover:text-white transition-colors text-base rounded-lg hover:bg-white/10"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    className="block px-4 py-4 text-white/80 hover:text-white transition-colors text-base rounded-lg hover:bg-white/10"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    👨‍💼 Mi Perfil
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                    }}
                    className="block w-full text-left px-4 py-4 text-white/80 hover:text-white transition-colors text-base rounded-lg hover:bg-white/10"
                  >
                    <span className="text-red-400">➡️</span> Cerrar Sesión
                  </button>
                </>
              )}
              
              {!isAuthenticated && (
                <>
                  <Link
                    to="/login"
                    className="block px-4 py-4 text-white/80 hover:text-white transition-colors text-base rounded-lg hover:bg-white/10"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    🔑 Iniciar Sesión
                  </Link>
                  <Link
                    to="/register"
                    className="block px-4 py-4 text-white/80 hover:text-white transition-colors text-base rounded-lg hover:bg-white/10"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    ✨ Registrarse
                  </Link>
                </>
              )}
              
              <Link
                to="/about"
                className="block px-4 py-4 text-white/80 hover:text-white transition-colors text-base rounded-lg hover:bg-white/10"
                onClick={() => setIsMenuOpen(false)}
              >
                ℹ️ Acerca de
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation; 