import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import NumberGenerator from './components/NumberGenerator';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import Footer from './components/Footer';
import AdminPanel from './components/AdminPanel';
import AdminDebug from './components/AdminDebug';
import EmailVerification from './components/EmailVerification';
import MyNumbers from './components/MyNumbers';
import ProfilePage from './components/ProfilePage';
import './index.css';



// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

// Admin Route Component
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!user?.is_admin) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

// Simple placeholder pages
const MyNumbersPage: React.FC = () => <MyNumbers />;

const StatsPage: React.FC = () => (
  <div className="max-w-4xl mx-auto p-3 sm:p-4 lg:p-6">
    <div className="glass rounded-2xl p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4 lg:mb-6">Estadísticas</h1>
      <p className="text-white/80">Esta funcionalidad estará disponible pronto.</p>
    </div>
  </div>
);



const AboutPage: React.FC = () => (
  <div className="max-w-4xl mx-auto p-3 sm:p-4 lg:p-6">
    <div className="glass rounded-2xl p-4 sm:p-6 lg:p-8">
      <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4 lg:mb-6">Acerca de JuegaDom</h1>
      <div className="text-white/90 space-y-3 sm:space-y-4 text-xs sm:text-sm lg:text-base">
        <p>
          Bienvenido a JuegaDom - Sistema de Generación de Números de Lotería Dominicana. 
          Esta aplicación te permite generar números de lotería basados en las reglas 
          oficiales de los diferentes juegos disponibles.
        </p>
        <p>
          <strong>Características principales:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1 sm:space-y-2 ml-3 sm:ml-4">
          <li>Generación de números para Leidsa, Kino, Pale y Tripleta</li>
          <li>Análisis de probabilidades basado en números históricos</li>
          <li>Registro y guardado de números generados</li>
          <li>Estadísticas personales y globales</li>
          <li>Interfaz moderna y fácil de usar</li>
        </ul>
        <p>
          <strong>Tipos de Juego:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1 sm:space-y-2 ml-3 sm:ml-4">
          <li><strong>Leidsa:</strong> 6 números del 1 al 40 + Más del 1 al 12</li>
          <li><strong>Kino:</strong> 10 números del 1 al 80</li>
          <li><strong>Pale:</strong> 2 números en orden del 00 al 99</li>
          <li><strong>Tripleta:</strong> 3 números del 00 al 99</li>
        </ul>
        <p className="text-xs sm:text-sm text-white/70 mt-4 sm:mt-6">
          ⚠️ Este sistema es solo para entretenimiento. El juego de azar puede ser adictivo. 
          Juega responsablemente.
        </p>
      </div>
    </div>
  </div>
);

// Main App Content
const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <div className="min-h-screen bg-black flex flex-col">
        <Navigation />
        <main className="pt-8 flex-1">
          <Routes>
            <Route path="/" element={<NumberGenerator />} />
            <Route path="/login" element={!isAuthenticated ? <LoginForm /> : <Navigate to="/" />} />
            <Route path="/register" element={!isAuthenticated ? <RegisterForm /> : <Navigate to="/" />} />
            <Route path="/my-numbers" element={<ProtectedRoute><MyNumbersPage /></ProtectedRoute>} />
            <Route path="/stats" element={<ProtectedRoute><StatsPage /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
            <Route path="/admin" element={<AdminRoute><AdminPanel /></AdminRoute>} />
            <Route path="/debug" element={<AdminRoute><AdminDebug /></AdminRoute>} />
            <Route path="/verify-email" element={<EmailVerification />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

// Main App Component
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
