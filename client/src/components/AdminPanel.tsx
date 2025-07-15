import React, { useState, useEffect } from 'react';
import { adminService } from '../services/supabaseService';

interface User {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  created_at: string;
  total_numbers: number;
  deleted_numbers: number;
}

interface LotteryNumber {
  id: string;
  numbers: number[];
  mas?: number;
  game_type: string;
  generated_at: string;
  is_deleted: boolean;
  deleted_at?: string;
  username: string;
  email: string;
}

interface AdminStats {
  users: {
    total_users: number;
    total_admins: number;
    new_users_week: number;
    new_users_month: number;
  };
  numbers: {
    total_numbers: number;
    deleted_numbers: number;
    new_numbers_week: number;
    new_numbers_month: number;
  };
  games: Array<{
    game_type: string;
    count: number;
  }>;
}

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'numbers'>('dashboard');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dashboard stats
  const [stats, setStats] = useState<AdminStats | null>(null);

  // Users management
  const [users, setUsers] = useState<User[]>([]);
  const [usersPage, setUsersPage] = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersSearch, setUsersSearch] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Nuevo estado para modal de creación de usuario
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [createUserError, setCreateUserError] = useState<string | null>(null);

  // Numbers management
  const [numbers, setNumbers] = useState<LotteryNumber[]>([]);
  const [numbersPage, setNumbersPage] = useState(1);
  const [numbersTotalPages, setNumbersTotalPages] = useState(1);
  const [numbersFilter, setNumbersFilter] = useState({
    userId: '',
    gameType: '',
    includeDeleted: false
  });

  // Load dashboard stats
  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getStats();
      setStats(data);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  // Load users
  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getUsers(usersPage, 10, usersSearch);
      setUsers(data.users);
      setUsersTotalPages(data.pagination.totalPages);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  // Load lottery numbers
  const loadNumbers = async () => {
    try {
      setLoading(true);
      const data = await adminService.getLotteryNumbers(
        numbersPage, 
        10, 
        numbersFilter.userId, 
        numbersFilter.gameType, 
        numbersFilter.includeDeleted
      );
      setNumbers(data.numbers);
      setNumbersTotalPages(data.pagination.totalPages);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Error al cargar números');
    } finally {
      setLoading(false);
    }
  };

  // Update user
  const handleUpdateUser = async (userId: string, data: { username: string; email: string; is_admin: boolean }) => {
    try {
      await adminService.updateUser(userId, data);
      setSuccess('Usuario actualizado correctamente');
      setEditingUser(null);
      loadUsers();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Error al actualizar usuario');
    }
  };

  // Delete user
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await adminService.deleteUser(userId);
      setSuccess('Usuario eliminado correctamente');
      loadUsers();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Error al eliminar usuario');
    }
  };

  // Delete lottery number
  const handleDeleteNumber = async (numberId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este número?')) {
      return;
    }

    try {
      await adminService.deleteLotteryNumber(numberId);
      setSuccess('Número eliminado correctamente');
      loadNumbers();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Error al eliminar número');
    }
  };

  // Restore lottery number
  const handleRestoreNumber = async (numberId: string) => {
    try {
      await adminService.restoreLotteryNumber(numberId);
      setSuccess('Número restaurado correctamente');
      loadNumbers();
    } catch (error: any) {
      setError(error.response?.data?.error || 'Error al restaurar número');
    }
  };

  // Handler para crear usuario
  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreateUserError(null);
    setCreateUserLoading(true);
    const form = e.currentTarget;
    const username = (form.elements.namedItem('username') as HTMLInputElement).value;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;
    const is_admin = (form.elements.namedItem('is_admin') as HTMLInputElement).checked;
    try {
      await adminService.createUser(username, email, password, is_admin);
      setShowCreateUserModal(false);
      setSuccess('Usuario creado correctamente');
      loadUsers();
    } catch (err: any) {
      setCreateUserError(err.message || 'Error al crear usuario');
    } finally {
      setCreateUserLoading(false);
    }
  };

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'dashboard') {
      loadStats();
    } else if (activeTab === 'users') {
      loadUsers();
    } else if (activeTab === 'numbers') {
      loadNumbers();
    }
  }, [activeTab, usersPage, usersSearch, numbersPage, numbersFilter]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-ES');
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6">
      <div className="glass rounded-2xl p-4 sm:p-6 lg:p-8">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4 lg:mb-6">👑 Panel de Administración</h1>

        {/* Messages */}
        {error && (
          <div className="p-3 sm:p-4 bg-red-500/20 border border-red-500/50 rounded-lg mb-4 sm:mb-6">
            <p className="text-red-200 text-center text-xs sm:text-sm lg:text-base">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 sm:p-4 bg-green-500/20 border border-green-500/50 rounded-lg mb-4 sm:mb-6">
            <p className="text-green-200 text-center text-xs sm:text-sm lg:text-base">{success}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-4 sm:mb-6">
          <button
            onClick={() => { setActiveTab('dashboard'); clearMessages(); }}
            className={`px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm ${
              activeTab === 'dashboard'
                ? 'bg-primary-600 text-white'
                : 'bg-white/10 text-white/80 hover:text-white hover:bg-white/20'
            }`}
          >
            📊 Dashboard
          </button>
          <button
            onClick={() => { setActiveTab('users'); clearMessages(); }}
            className={`px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm ${
              activeTab === 'users'
                ? 'bg-primary-600 text-white'
                : 'bg-white/10 text-white/80 hover:text-white hover:bg-white/20'
            }`}
          >
            👥 Usuarios
          </button>
          <button
            onClick={() => { setActiveTab('numbers'); clearMessages(); }}
            className={`px-3 sm:px-4 py-2 rounded-lg transition-colors text-xs sm:text-sm ${
              activeTab === 'numbers'
                ? 'bg-primary-600 text-white'
                : 'bg-white/10 text-white/80 hover:text-white hover:bg-white/20'
            }`}
          >
            🎲 Números Generados
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-white/80 text-sm">Cargando...</p>
          </div>
        )}

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div className="space-y-4 sm:space-y-6">
            {/* User Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white/10 rounded-lg p-3 sm:p-4">
                <h3 className="text-white/60 text-xs sm:text-sm">Total Usuarios</h3>
                <p className="text-white font-bold text-lg sm:text-xl">{stats.users.total_users}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 sm:p-4">
                <h3 className="text-white/60 text-xs sm:text-sm">Administradores</h3>
                <p className="text-white font-bold text-lg sm:text-xl">{stats.users.total_admins}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 sm:p-4">
                <h3 className="text-white/60 text-xs sm:text-sm">Nuevos (7 días)</h3>
                <p className="text-white font-bold text-lg sm:text-xl">{stats.users.new_users_week}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 sm:p-4">
                <h3 className="text-white/60 text-xs sm:text-sm">Nuevos (30 días)</h3>
                <p className="text-white font-bold text-lg sm:text-xl">{stats.users.new_users_month}</p>
              </div>
            </div>

            {/* Number Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white/10 rounded-lg p-3 sm:p-4">
                <h3 className="text-white/60 text-xs sm:text-sm">Total Números</h3>
                <p className="text-white font-bold text-lg sm:text-xl">{stats.numbers.total_numbers}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 sm:p-4">
                <h3 className="text-white/60 text-xs sm:text-sm">Eliminados</h3>
                <p className="text-white font-bold text-lg sm:text-xl">{stats.numbers.deleted_numbers}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 sm:p-4">
                <h3 className="text-white/60 text-xs sm:text-sm">Nuevos (7 días)</h3>
                <p className="text-white font-bold text-lg sm:text-xl">{stats.numbers.new_numbers_week}</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 sm:p-4">
                <h3 className="text-white/60 text-xs sm:text-sm">Nuevos (30 días)</h3>
                <p className="text-white font-bold text-lg sm:text-xl">{stats.numbers.new_numbers_month}</p>
              </div>
            </div>

            {/* Game Stats */}
            <div className="bg-white/10 rounded-lg p-3 sm:p-4">
              <h3 className="text-white font-bold text-base sm:text-lg mb-3 sm:mb-4">Números por Juego</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {stats.games.map((game) => (
                  <div key={game.game_type} className="bg-white/5 rounded-lg p-3">
                    <h4 className="text-white/80 text-xs sm:text-sm capitalize">{game.game_type}</h4>
                    <p className="text-white font-bold text-base sm:text-lg">{game.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <input
                type="text"
                placeholder="Buscar usuarios..."
                value={usersSearch}
                onChange={(e) => setUsersSearch(e.target.value)}
                className="flex-1 px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base min-h-[44px]"
              />
              <button
                onClick={() => setUsersPage(1)}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs sm:text-sm min-h-[44px]"
              >
                Buscar
              </button>
            </div>

            {/* Botón Crear Usuario */}
            {activeTab === 'users' && (
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => { setShowCreateUserModal(true); clearMessages(); }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs sm:text-sm"
                >
                  + Crear Usuario
                </button>
              </div>
            )}

            {/* Users List - Desktop Table */}
            <div className="hidden lg:block bg-white/10 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 text-left text-white text-xs sm:text-sm">Usuario</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-white text-xs sm:text-sm">Email</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-white text-xs sm:text-sm">Rol</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-white text-xs sm:text-sm">Números</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-white text-xs sm:text-sm">Registro</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-white text-xs sm:text-sm">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-t border-white/10">
                        <td className="px-3 sm:px-4 py-3 text-white text-xs sm:text-sm">{user.username}</td>
                        <td className="px-3 sm:px-4 py-3 text-white text-xs sm:text-sm">{user.email}</td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.is_admin 
                              ? 'bg-red-500/20 text-red-200' 
                              : 'bg-green-500/20 text-green-200'
                          }`}>
                            {user.is_admin ? 'Admin' : 'Usuario'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-white text-xs sm:text-sm">
                          {user.total_numbers} ({user.deleted_numbers} eliminados)
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-white text-xs sm:text-sm">
                          {formatDate(user.created_at)}
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm">
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingUser(user)}
                              className="px-2 py-1 bg-blue-500/20 text-blue-200 rounded hover:bg-blue-500/30 transition-colors min-h-[32px] min-w-[32px]"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="px-2 py-1 bg-red-500/20 text-red-200 rounded hover:bg-red-500/30 transition-colors min-h-[32px] min-w-[32px]"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Users List - Mobile Cards */}
            <div className="lg:hidden space-y-3 sm:space-y-4">
              {users.map((user) => (
                <div key={user.id} className="bg-white/10 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-sm sm:text-base">{user.username}</h3>
                      <p className="text-white/70 text-xs sm:text-sm">{user.email}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      user.is_admin 
                        ? 'bg-red-500/20 text-red-200' 
                        : 'bg-green-500/20 text-green-200'
                    }`}>
                      {user.is_admin ? 'Admin' : 'Usuario'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div>
                      <span className="text-white/60">Números:</span>
                      <span className="text-white ml-1">{user.total_numbers} ({user.deleted_numbers} eliminados)</span>
                    </div>
                    <div>
                      <span className="text-white/60">Registro:</span>
                      <span className="text-white ml-1">{formatDate(user.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => setEditingUser(user)}
                      className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-200 rounded hover:bg-blue-500/30 transition-colors text-xs sm:text-sm min-h-[36px]"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="flex-1 px-3 py-2 bg-red-500/20 text-red-200 rounded hover:bg-red-500/30 transition-colors text-xs sm:text-sm min-h-[36px]"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {usersTotalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex space-x-1 sm:space-x-2">
                  <button
                    onClick={() => setUsersPage(Math.max(1, usersPage - 1))}
                    disabled={usersPage === 1}
                    className="px-2 sm:px-3 py-1 sm:py-2 bg-white/10 text-white rounded hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm min-h-[36px] sm:min-h-[40px] min-w-[36px] sm:min-w-[40px] flex items-center justify-center"
                  >
                    ◀️
                  </button>
                  <button
                    onClick={() => setUsersPage(Math.min(usersTotalPages, usersPage + 1))}
                    disabled={usersPage === usersTotalPages}
                    className="px-2 sm:px-3 py-1 sm:py-2 bg-white/10 text-white rounded hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm min-h-[36px] sm:min-h-[40px] min-w-[36px] sm:min-w-[40px] flex items-center justify-center"
                  >
                    ▶️
                  </button>
                </div>
                <span className="text-white/80 text-xs sm:text-sm">
                  Página {usersPage} de {usersTotalPages}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Numbers Tab */}
        {activeTab === 'numbers' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <input
                type="text"
                placeholder="ID de usuario..."
                value={numbersFilter.userId}
                onChange={(e) => setNumbersFilter({...numbersFilter, userId: e.target.value})}
                className="px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base min-h-[44px]"
              />
              <select
                value={numbersFilter.gameType}
                onChange={(e) => setNumbersFilter({...numbersFilter, gameType: e.target.value})}
                className="px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base min-h-[44px]"
              >
                <option value="">Todos los juegos</option>
                <option value="leidsa">Leidsa</option>
                <option value="kino">Kino</option>
                <option value="pale">Pale</option>
                <option value="tripleta">Tripleta</option>
              </select>
              <label className="flex items-center space-x-2 text-white text-sm min-h-[44px]">
                <input
                  type="checkbox"
                  checked={numbersFilter.includeDeleted}
                  onChange={(e) => setNumbersFilter({...numbersFilter, includeDeleted: e.target.checked})}
                  className="rounded w-4 h-4 sm:w-5 sm:h-5"
                />
                <span className="text-xs sm:text-sm">Incluir eliminados</span>
              </label>
              <button
                onClick={() => setNumbersPage(1)}
                className="px-4 sm:px-6 py-2 sm:py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs sm:text-sm min-h-[44px]"
              >
                Filtrar
              </button>
            </div>

            {/* Numbers List - Desktop Table */}
            <div className="hidden lg:block bg-white/10 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-white/10">
                    <tr>
                      <th className="px-3 sm:px-4 py-3 text-left text-white text-xs sm:text-sm">Usuario</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-white text-xs sm:text-sm">Juego</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-white text-xs sm:text-sm">Números</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-white text-xs sm:text-sm">Más</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-white text-xs sm:text-sm">Generado</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-white text-xs sm:text-sm">Estado</th>
                      <th className="px-3 sm:px-4 py-3 text-left text-white text-xs sm:text-sm">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {numbers.map((number) => (
                      <tr key={number.id} className={`border-t border-white/10 ${number.is_deleted ? 'opacity-50' : ''}`}>
                        <td className="px-3 sm:px-4 py-3 text-white text-xs sm:text-sm">{number.username}</td>
                        <td className="px-3 sm:px-4 py-3 text-white text-xs sm:text-sm capitalize">{number.game_type}</td>
                        <td className="px-3 sm:px-4 py-3 text-white text-xs sm:text-sm font-mono">{number.numbers.join(', ')}</td>
                        <td className="px-3 sm:px-4 py-3 text-white text-xs sm:text-sm font-mono">{number.mas || '-'}</td>
                        <td className="px-3 sm:px-4 py-3 text-white text-xs sm:text-sm">{formatDate(number.generated_at)}</td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            number.is_deleted 
                              ? 'bg-red-500/20 text-red-200' 
                              : 'bg-green-500/20 text-green-200'
                          }`}>
                            {number.is_deleted ? 'Eliminado' : 'Activo'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-4 py-3 text-xs sm:text-sm">
                          <div className="flex gap-2">
                            {number.is_deleted ? (
                              <button
                                onClick={() => handleRestoreNumber(number.id)}
                                className="px-2 py-1 bg-green-500/20 text-green-200 rounded hover:bg-green-500/30 transition-colors min-h-[32px] min-w-[32px]"
                              >
                                🔄
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDeleteNumber(number.id)}
                                className="px-2 py-1 bg-red-500/20 text-red-200 rounded hover:bg-red-500/30 transition-colors min-h-[32px] min-w-[32px]"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Numbers List - Mobile Cards */}
            <div className="lg:hidden space-y-3 sm:space-y-4">
              {numbers.map((number) => (
                <div key={number.id} className={`bg-white/10 rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3 ${number.is_deleted ? 'opacity-50' : ''}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-sm sm:text-base">{number.username}</h3>
                      <p className="text-white/70 text-xs sm:text-sm capitalize">{number.game_type}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      number.is_deleted 
                        ? 'bg-red-500/20 text-red-200' 
                        : 'bg-green-500/20 text-green-200'
                    }`}>
                      {number.is_deleted ? 'Eliminado' : 'Activo'}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="text-white/60 text-xs sm:text-sm">Números:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {number.numbers.map((num, index) => (
                          <span key={index} className="bg-gradient-to-r from-lottery-gold to-yellow-400 text-gray-800 px-2 py-1 rounded text-xs font-bold">
                            {num.toString().padStart(2, '0')}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {number.mas && (
                      <div>
                        <span className="text-white/60 text-xs sm:text-sm">Más:</span>
                        <div className="mt-1">
                          <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 py-1 rounded text-xs font-bold border-2 border-blue-300">
                            {number.mas.toString().padStart(2, '0')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                    <div>
                      <span className="text-white/60">Generado:</span>
                      <span className="text-white ml-1">{formatDate(number.generated_at)}</span>
                    </div>
                    {number.deleted_at && (
                      <div>
                        <span className="text-white/60">Eliminado:</span>
                        <span className="text-white ml-1">{formatDate(number.deleted_at)}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    {number.is_deleted ? (
                      <button
                        onClick={() => handleRestoreNumber(number.id)}
                        className="flex-1 px-3 py-2 bg-green-500/20 text-green-200 rounded hover:bg-green-500/30 transition-colors text-xs sm:text-sm min-h-[36px]"
                      >
                        🔄 Restaurar
                      </button>
                    ) : (
                      <button
                        onClick={() => handleDeleteNumber(number.id)}
                        className="flex-1 px-3 py-2 bg-red-500/20 text-red-200 rounded hover:bg-red-500/30 transition-colors text-xs sm:text-sm min-h-[36px]"
                      >
                        🗑️ Eliminar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {numbersTotalPages > 1 && (
              <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex space-x-1 sm:space-x-2">
                  <button
                    onClick={() => setNumbersPage(Math.max(1, numbersPage - 1))}
                    disabled={numbersPage === 1}
                    className="px-2 sm:px-3 py-1 sm:py-2 bg-white/10 text-white rounded hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm min-h-[36px] sm:min-h-[40px] min-w-[36px] sm:min-w-[40px] flex items-center justify-center"
                  >
                    ◀️
                  </button>
                  <button
                    onClick={() => setNumbersPage(Math.min(numbersTotalPages, numbersPage + 1))}
                    disabled={numbersPage === numbersTotalPages}
                    className="px-2 sm:px-3 py-1 sm:py-2 bg-white/10 text-white rounded hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm min-h-[36px] sm:min-h-[40px] min-w-[36px] sm:min-w-[40px] flex items-center justify-center"
                  >
                    ▶️
                  </button>
                </div>
                <span className="text-white/80 text-xs sm:text-sm">
                  Página {numbersPage} de {numbersTotalPages}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Edit User Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-3 sm:p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-white font-bold text-lg sm:text-xl mb-4">Editar Usuario</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleUpdateUser(editingUser.id, {
                  username: formData.get('username') as string,
                  email: formData.get('email') as string,
                  is_admin: formData.get('is_admin') === 'true'
                });
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white text-sm sm:text-base mb-2">Username</label>
                    <input
                      type="text"
                      name="username"
                      defaultValue={editingUser.username}
                      required
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="block text-white text-sm sm:text-base mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={editingUser.email}
                      required
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm sm:text-base min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="flex items-center space-x-3 text-white text-sm sm:text-base min-h-[44px]">
                      <input
                        type="checkbox"
                        name="is_admin"
                        value="true"
                        defaultChecked={editingUser.is_admin}
                        className="rounded w-4 h-4 sm:w-5 sm:h-5"
                      />
                      <span>Es administrador</span>
                    </label>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base min-h-[44px]"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base min-h-[44px]"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Crear Usuario */}
        {showCreateUserModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-white font-bold text-lg sm:text-xl mb-4">Crear Usuario</h3>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-white text-sm sm:text-base mb-2">Nombre de usuario</label>
                  <input
                    type="text"
                    name="username"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm sm:text-base mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm sm:text-base mb-2">Contraseña</label>
                  <input
                    type="password"
                    name="password"
                    required
                    minLength={6}
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm sm:text-base"
                  />
                </div>
                <div>
                  <label className="flex items-center space-x-3 text-white text-sm sm:text-base">
                    <input
                      type="checkbox"
                      name="is_admin"
                      className="rounded w-4 h-4 sm:w-5 sm:h-5"
                    />
                    <span>Es administrador</span>
                  </label>
                </div>
                {createUserError && (
                  <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <p className="text-red-200 text-center text-sm">{createUserError}</p>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    type="submit"
                    disabled={createUserLoading}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base min-h-[44px]"
                  >
                    {createUserLoading ? 'Creando...' : 'Crear'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateUserModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base min-h-[44px]"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel; 