import React, { useState, useEffect } from 'react';
import { GameType, GeneratedNumbers } from '../types';
import { lotteryService } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';
import LotteryNumberSet from './LotteryNumberSet';
import { supabase } from '../config/supabase';

const MyNumbers: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [userNumbers, setUserNumbers] = useState<GeneratedNumbers[]>([]);
  const [userStats, setUserStats] = useState<{
    total_generations: number;
    game_stats: Record<GameType, number>;
    recent_activity: string;
  } | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameType | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [numberToDelete, setNumberToDelete] = useState<{ id: string; gameType: string; numbers: number[]; mas?: number } | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalNumbers, setTotalNumbers] = useState(0);
  const numbersPerPage = 10;

  useEffect(() => {
    if (isAuthenticated) {
      loadUserNumbers();
      loadUserStats();
    }
  }, [isAuthenticated, selectedGame, currentPage]);

  const loadUserNumbers = async () => {
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const gameType = selectedGame === 'all' ? undefined : selectedGame;
      
      // Calculate offset for pagination
      const offset = (currentPage - 1) * numbersPerPage;
      
      // Get total count first
      const totalCount = await getTotalNumbers(gameType);
      setTotalNumbers(totalCount);
      setTotalPages(Math.ceil(totalCount / numbersPerPage));
      
      // Get paginated numbers
      const numbers = await lotteryService.getMyNumbers(gameType, numbersPerPage, offset);
      setUserNumbers(numbers);
    } catch (error: any) {
      setError(error.message || 'Error al cargar números guardados');
    } finally {
      setLoading(false);
    }
  };

  const getTotalNumbers = async (gameType?: GameType): Promise<number> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      let query = supabase
        .from('lottery_numbers')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('is_deleted', false);

      if (gameType) {
        query = query.eq('game_type', gameType);
      }

      const { count, error } = await query;
      
      if (error) {
        console.error('Error getting total count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting total numbers:', error);
      return 0;
    }
  };

  const loadUserStats = async () => {
    if (!isAuthenticated) return;
    
    try {
      const stats = await lotteryService.getUserStats();
      setUserStats(stats);
    } catch (error: any) {
      console.error('Error loading user stats:', error);
    }
  };

  const handleDeleteClick = (numberSet: GeneratedNumbers) => {
    setNumberToDelete({
      id: numberSet.id,
      gameType: numberSet.game_type,
      numbers: numberSet.numbers,
      mas: numberSet.mas
    });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!numberToDelete || !isAuthenticated) return;
    
    setShowDeleteModal(false);
    setDeleteLoading(numberToDelete.id);
    
    try {
      await lotteryService.deleteUserNumber(numberToDelete.id);
      // Reload numbers and stats
      await loadUserNumbers();
      await loadUserStats();
    } catch (error: any) {
      setError(error.message || 'Error al eliminar número');
    } finally {
      setDeleteLoading(null);
      setNumberToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setNumberToDelete(null);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const goToLastPage = () => {
    setCurrentPage(totalPages);
  };

  const gameOptions: { value: GameType | 'all'; label: string }[] = [
    { value: 'all', label: 'Todos los Juegos' },
    { value: 'leidsa', label: 'Leidsa' },
    { value: 'kino', label: 'Kino' },
    { value: 'pale', label: 'Pale' },
    { value: 'tripleta', label: 'Tripleta' },
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl mx-auto p-3 sm:p-4 lg:p-6">
        <div className="glass rounded-2xl p-4 sm:p-6 lg:p-8 text-center">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4 sm:mb-6">
            🔒 Mis Números
          </h2>
          <p className="text-white/80 text-sm sm:text-base mb-6">
            Inicia sesión para ver tus números guardados
          </p>
          <a 
            href="/login" 
            className="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Iniciar Sesión
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4 lg:p-6">
      <div className="glass rounded-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4 sm:mb-6 text-center">
          📊 Mis Números
        </h2>

        {/* User Statistics */}
        {userStats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 mb-4 sm:mb-6">
            <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4 text-center">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-lottery-gold">
                {userStats.total_generations}
              </div>
              <div className="text-white/80 text-xs sm:text-sm">Total Generados</div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4 text-center">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-lottery-gold">
                {userStats.game_stats.leidsa}
              </div>
              <div className="text-white/80 text-xs sm:text-sm">Leidsa</div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4 text-center">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-lottery-gold">
                {userStats.game_stats.kino}
              </div>
              <div className="text-white/80 text-xs sm:text-sm">Kino</div>
            </div>
            
            <div className="bg-white/10 rounded-lg p-2 sm:p-3 lg:p-4 text-center">
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-lottery-gold">
                {userStats.recent_activity}
              </div>
              <div className="text-white/80 text-xs sm:text-sm">Última Actividad</div>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-wrap gap-1 sm:gap-2 lg:gap-3">
            {gameOptions.map((game) => (
              <button
                key={game.value}
                onClick={() => {
                  setSelectedGame(game.value);
                  setCurrentPage(1); // Reset to first page when changing filter
                }}
                className={`
                  px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm lg:text-base font-medium transition-all duration-300 min-h-[36px] sm:min-h-[40px]
                  ${selectedGame === game.value
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'bg-white/20 text-white hover:bg-white/30'
                  }
                `}
              >
                {game.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 sm:p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-200 text-center text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-lottery-gold mx-auto mb-4"></div>
            <p className="text-white/80">Cargando números...</p>
          </div>
        )}

        {/* Numbers List */}
        {!loading && userNumbers.length === 0 && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">🎲</div>
            <p className="text-white/80 text-lg mb-4">No tienes números guardados</p>
            <p className="text-white/60 text-sm">
              {selectedGame === 'all' 
                ? 'Genera algunos números para verlos aquí'
                : `No tienes números guardados de ${gameOptions.find(g => g.value === selectedGame)?.label}`
              }
            </p>
          </div>
        )}

        {!loading && userNumbers.length > 0 && (
          <div className="space-y-3 sm:space-y-4 lg:space-y-6">
            {userNumbers.map((numberSet, index) => (
              <div key={numberSet.id} className="bg-white/10 rounded-lg p-3 sm:p-4 lg:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-3 sm:mb-4">
                  <span className="text-lottery-gold font-bold text-sm sm:text-base">
                    {gameOptions.find(g => g.value === numberSet.game_type)?.label}
                  </span>
                  <span className="text-white/60 text-xs sm:text-sm">
                    {formatDate(numberSet.generated_at)}
                  </span>
                </div>
                
                <LotteryNumberSet
                  numbers={numberSet.numbers}
                  mas={numberSet.mas}
                  gameType={numberSet.game_type}
                  showGameType={false}
                />
                
                <div className="flex justify-end mt-3 sm:mt-4">
                  <button
                    onClick={() => handleDeleteClick(numberSet)}
                    disabled={deleteLoading === numberSet.id}
                    className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors duration-200 disabled:opacity-50 min-h-[36px] px-3 py-1.5 rounded"
                  >
                    {deleteLoading === numberSet.id ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="mt-4 sm:mt-6">
            {/* Page Info - Mobile */}
            <div className="flex justify-center mb-3 sm:hidden">
              <div className="text-center">
                <div className="text-white/80 text-sm">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="text-white/60 text-xs">
                  ({totalNumbers} números total)
                </div>
              </div>
            </div>
            
            {/* Navigation Buttons - Mobile */}
            <div className="flex justify-center space-x-2 mb-3 sm:hidden">
              <button
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                className="px-2 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs min-h-[36px] min-w-[36px]"
              >
                ⏮️
              </button>
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-2 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs min-h-[36px] min-w-[36px]"
              >
                ◀️
              </button>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-2 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs min-h-[36px] min-w-[36px]"
              >
                ▶️
              </button>
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className="px-2 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs min-h-[36px] min-w-[36px]"
              >
                ⏭️
              </button>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden sm:flex flex-row justify-center items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  ⏮️ Primera
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  ◀️ Anterior
                </button>
              </div>
              
              <div className="flex items-center space-x-2">
                <span className="text-white/80 text-sm">
                  Página {currentPage} de {totalPages}
                </span>
                <span className="text-white/60 text-xs">
                  ({totalNumbers} números total)
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Siguiente ▶️
                </button>
                <button
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  Última ⏭️
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && numberToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-gray-800 rounded-lg p-4 sm:p-6 max-w-md w-full mx-2">
              <div className="text-center">
                <div className="text-red-400 text-3xl sm:text-4xl mb-3 sm:mb-4">⚠️</div>
                <h3 className="text-white text-base sm:text-lg font-bold mb-2">Confirmar Eliminación</h3>
                <p className="text-white/80 text-xs sm:text-sm mb-3 sm:mb-4">
                  ¿Estás seguro de que deseas eliminar este número?
                </p>
                
                {/* Show the numbers to be deleted */}
                <div className="bg-white/10 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                  <div className="text-white/60 text-xs mb-2">
                    {gameOptions.find(g => g.value === numberToDelete.gameType)?.label}
                  </div>
                  <div className="flex flex-wrap justify-center gap-1 sm:gap-2">
                    {numberToDelete.numbers.map((number, index) => (
                      <div
                        key={index}
                        className="w-6 h-6 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold"
                      >
                        {number.toString().padStart(2, '0')}
                      </div>
                    ))}
                    {numberToDelete.mas && (
                      <>
                        <div className="text-white/60 text-xs self-center">Más:</div>
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                          {numberToDelete.mas.toString().padStart(2, '0')}
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <p className="text-red-300 text-xs mb-4 sm:mb-6">
                  Esta acción no se puede deshacer.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                  <button
                    onClick={handleDeleteCancel}
                    className="flex-1 px-3 sm:px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200 text-sm sm:text-base min-h-[40px]"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="flex-1 px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 text-sm sm:text-base min-h-[40px]"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyNumbers; 