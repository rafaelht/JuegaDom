import React, { useState } from 'react';
import { adminAPI } from '../services/api';

const AdminDebug: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkAdminUser = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      const response = await fetch('http://localhost:5000/api/admin/debug/admin-user');
      const data = await response.json();
      
      if (data.exists) {
        setAdminUser(data.user);
        setMessage('✅ Usuario admin encontrado');
      } else {
        setAdminUser(null);
        setMessage('❌ Usuario admin no encontrado');
      }
    } catch (error: any) {
      setError('Error al verificar usuario admin: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const listAllUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('http://localhost:5000/api/admin/debug/users');
      const data = await response.json();
      
      setAllUsers(data.users);
      setMessage(`📊 Total de usuarios: ${data.total_users}`);
    } catch (error: any) {
      setError('Error al listar usuarios: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createAdminUser = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      const response = await fetch('http://localhost:5000/api/admin/debug/create-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setMessage('✅ Usuario admin creado exitosamente');
        setAdminUser({
          email: 'admin@loto.com',
          username: 'admin',
          is_admin: 1
        });
      } else {
        setMessage(data.message);
      }
    } catch (error: any) {
      setError('Error al crear usuario admin: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="glass rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white mb-6">🔧 Debug Panel de Administración</h1>

        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg mb-4">
            <p className="text-red-200 text-center">{error}</p>
          </div>
        )}

        {message && (
          <div className="p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg mb-4">
            <p className="text-blue-200 text-center">{message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            onClick={checkAdminUser}
            disabled={loading}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            🔍 Verificar Admin
          </button>
          
          <button
            onClick={listAllUsers}
            disabled={loading}
            className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            📋 Listar Usuarios
          </button>
          
          <button
            onClick={createAdminUser}
            disabled={loading}
            className="px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
          >
            ➕ Crear Admin
          </button>
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-white/80">Cargando...</p>
          </div>
        )}

        {/* Admin User Info */}
        {adminUser && (
          <div className="bg-white/10 rounded-lg p-4 mb-4">
            <h3 className="text-white font-bold text-lg mb-3">👑 Usuario Admin</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-white/60 text-sm">Email:</label>
                <p className="text-white font-semibold">{adminUser.email}</p>
              </div>
              <div>
                <label className="text-white/60 text-sm">Username:</label>
                <p className="text-white font-semibold">{adminUser.username}</p>
              </div>
              <div>
                <label className="text-white/60 text-sm">Es Admin:</label>
                <p className="text-white font-semibold">{adminUser.is_admin ? '✅ Sí' : '❌ No'}</p>
              </div>
              <div>
                <label className="text-white/60 text-sm">Creado:</label>
                <p className="text-white font-semibold">{new Date(adminUser.created_at).toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
              <p className="text-green-200 text-sm">
                <strong>Credenciales:</strong> admin@loto.com / admin123
              </p>
            </div>
          </div>
        )}

        {/* All Users List */}
        {allUsers.length > 0 && (
          <div className="bg-white/10 rounded-lg p-4">
            <h3 className="text-white font-bold text-lg mb-3">👥 Todos los Usuarios ({allUsers.length})</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/10">
                  <tr>
                    <th className="px-3 py-2 text-left text-white text-sm">Email</th>
                    <th className="px-3 py-2 text-left text-white text-sm">Username</th>
                    <th className="px-3 py-2 text-left text-white text-sm">Admin</th>
                    <th className="px-3 py-2 text-left text-white text-sm">Creado</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map((user, index) => (
                    <tr key={user.id} className="border-t border-white/10">
                      <td className="px-3 py-2 text-white text-sm">{user.email}</td>
                      <td className="px-3 py-2 text-white text-sm">{user.username}</td>
                      <td className="px-3 py-2 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.is_admin 
                            ? 'bg-red-500/20 text-red-200' 
                            : 'bg-green-500/20 text-green-200'
                        }`}>
                          {user.is_admin ? 'Admin' : 'Usuario'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-white text-sm">
                        {new Date(user.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <a 
            href="/login" 
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            🔑 Ir al Login
          </a>
        </div>
      </div>
    </div>
  );
};

export default AdminDebug; 