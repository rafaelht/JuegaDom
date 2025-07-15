import React, { useState, useEffect } from 'react';
import { GameType, GeneratedNumbers, GameConfig } from '../types';
import { lotteryService } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';
import LotteryNumber from './LotteryNumber';

const NumberGenerator: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [selectedGame, setSelectedGame] = useState<GameType>('leidsa');
  const [quantity, setQuantity] = useState(1);
  const [includeMas, setIncludeMas] = useState(false);
  const [generateMasOnly, setGenerateMasOnly] = useState(false);
  const [generatedNumbers, setGeneratedNumbers] = useState<GeneratedNumbers[]>([]);
  const [loading, setLoading] = useState(false);
  const [games, setGames] = useState<Record<GameType, GameConfig>>({} as Record<GameType, GameConfig>);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    loadGames();
  }, []);

  // Reset Más options when game changes
  useEffect(() => {
    if (selectedGame !== 'leidsa') {
      setIncludeMas(false);
      setGenerateMasOnly(false);
    }
  }, [selectedGame]);

  const loadGames = async () => {
    try {
      const games = await lotteryService.getGames();
      const gamesConfig: Record<GameType, GameConfig> = {
        leidsa: games.find(g => g.name === 'Leidsa') || { name: 'Leidsa', maxNumber: 40, numbersToPick: 6, description: '6 números del 1 al 40 + Más del 1 al 12', hasMas: true, masMaxNumber: 12 },
        kino: games.find(g => g.name === 'Kino') || { name: 'Kino', maxNumber: 80, numbersToPick: 10, description: '10 números del 1 al 80' },
        pale: games.find(g => g.name === 'Pale') || { name: 'Pale', maxNumber: 99, numbersToPick: 2, description: '2 números del 00 al 99' },
        tripleta: games.find(g => g.name === 'Tripleta') || { name: 'Tripleta', maxNumber: 99, numbersToPick: 3, description: '3 números del 00 al 99' }
      };
      setGames(gamesConfig);
    } catch (error) {
      console.error('Error loading games:', error);
    }
  };

  const generateNumbers = async () => {
    setLoading(true);
    setError(null);
    setSaveMessage(null);
    
    try {
      const requestData = {
        game_type: selectedGame,
        quantity,
        include_mas: includeMas,
        generate_mas_only: generateMasOnly
      };

      const response = await (isAuthenticated 
        ? lotteryService.generateNumbers(requestData)
        : lotteryService.generateDemoNumbers(requestData)
      );
      
      setGeneratedNumbers(response.numbers);

      // Show success message for both authenticated and demo modes
      if (response.numbers.length > 0) {
        if (isAuthenticated) {
          setSaveMessage('✅ Números generados y guardados exitosamente en tu cuenta');
        } else {
                      // Save numbers to statistics in demo mode
            try {
              for (const numberSet of response.numbers) {
                if (numberSet.numbers && numberSet.numbers.length > 0) {
                  await lotteryService.saveDemoNumbers({
                    game_type: selectedGame,
                    numbers: numberSet.numbers,
                    mas: numberSet.mas
                  });
                }
              }
              setSaveMessage('✅ Números guardados en estadísticas para análisis de probabilidades');
            } catch (saveError) {
              console.error('Error saving demo numbers:', saveError);
              // Don't show error to user, just log it
            }
        }
      }

    } catch (error: any) {
      setError(error.response?.data?.error || 'Error al generar números');
    } finally {
      setLoading(false);
    }
  };

  const gameOptions: { value: GameType; label: string; description: string }[] = [
    { value: 'leidsa', label: 'Leidsa', description: '6 números del 1-40 + Más del 1-12' },
    { value: 'kino', label: 'Kino', description: '10 números del 1-80' },
    { value: 'pale', label: 'Pale', description: '2 números del 00-99' },
    { value: 'tripleta', label: 'Tripleta', description: '3 números del 00-99' },
  ];

  const isLeidsa = selectedGame === 'leidsa';

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-4 lg:p-6">
      <div className="glass rounded-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-4 sm:mb-6 text-center">
          🎲 JuegaDom - Generador de Números
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Game Selection */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-3 sm:mb-4">Selecciona el Juego</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {gameOptions.map((game) => (
                <button
                  key={game.value}
                  onClick={() => setSelectedGame(game.value)}
                  className={`
                    p-3 sm:p-4 rounded-lg text-left transition-all duration-300 min-h-[70px] sm:min-h-[80px] lg:min-h-[100px]
                    ${selectedGame === game.value
                      ? 'bg-primary-600 text-white shadow-lg transform scale-105'
                      : 'bg-white/20 text-white hover:bg-white/30'
                    }
                  `}
                >
                  <div className="font-semibold text-sm sm:text-base">{game.label}</div>
                  <div className="text-xs sm:text-sm opacity-80 mt-1">{game.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selection */}
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-3 sm:mb-4">Cantidad</h3>
            <div className="flex items-center space-x-3 sm:space-x-4">
              <input
                type="range"
                min="1"
                max={isAuthenticated ? "10" : "5"}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="flex-1 h-2 sm:h-3 bg-white/20 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-white font-bold text-lg sm:text-xl min-w-[3rem] text-center">
                {quantity}
              </span>
            </div>
            <p className="text-white/80 text-xs sm:text-sm">
              {isAuthenticated 
                ? `Generar ${quantity} ${quantity === 1 ? 'combinación' : 'combinaciones'}`
                : `Demo: ${quantity} ${quantity === 1 ? 'combinación' : 'combinaciones'}`
              }
            </p>
          </div>
        </div>

        {/* Leidsa Más Options */}
        {isLeidsa && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-white/10 rounded-lg">
            <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-white mb-3">Opciones de Leidsa</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  checked={includeMas}
                  onChange={(e) => {
                    setIncludeMas(e.target.checked);
                    if (e.target.checked) setGenerateMasOnly(false);
                  }}
                  disabled={generateMasOnly}
                  className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 bg-white/20 border-white/30 rounded focus:ring-primary-500"
                />
                <span className="text-white text-sm sm:text-base">Incluir número Más (1-12)</span>
              </label>
              
              <label className="flex items-center space-x-3 cursor-pointer min-h-[44px]">
                <input
                  type="checkbox"
                  checked={generateMasOnly}
                  onChange={(e) => {
                    setGenerateMasOnly(e.target.checked);
                    if (e.target.checked) setIncludeMas(false);
                  }}
                  disabled={includeMas}
                  className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600 bg-white/20 border-white/30 rounded focus:ring-primary-500"
                />
                <span className="text-white text-sm sm:text-base">Generar solo número Más</span>
              </label>
            </div>
          </div>
        )}

        {/* Generate Button */}
        <div className="mt-4 sm:mt-6 lg:mt-8 text-center">
          <button
            onClick={generateNumbers}
            disabled={loading || !isAuthenticated}
            className={`
              w-full sm:w-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 rounded-full text-base sm:text-lg lg:text-xl font-bold transition-all duration-300 min-h-[48px] sm:min-h-[52px]
              ${loading || !isAuthenticated
                ? 'bg-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-lottery-gold to-yellow-400 hover:from-yellow-400 hover:to-lottery-gold transform hover:scale-105'
              }
              text-gray-800 shadow-lg
            `}
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 border-b-2 border-gray-800"></div>
                <span>Generando...</span>
              </div>
            ) : !isAuthenticated ? (
              '🔒 Inicia Sesión para Generar'
            ) : (
              generateMasOnly ? '🎲 Generar Solo Más' : '🎲 Generar Números'
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-red-200 text-center text-xs sm:text-sm lg:text-base">{error}</p>
          </div>
        )}

        {saveMessage && (
          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
            <p className="text-green-200 text-center text-xs sm:text-sm lg:text-base">{saveMessage}</p>
          </div>
        )}

        {!isAuthenticated && (
          <div className="mt-3 sm:mt-4 p-4 sm:p-6 bg-blue-500/20 border border-blue-500/50 rounded-lg">
            <div className="text-center space-y-3 sm:space-y-4">
              <p className="text-blue-200 text-xs sm:text-sm">
                💡 <strong>Modo Demo:</strong> Los números no se guardarán.
              </p>
              <p className="text-blue-200 text-xs sm:text-sm">
                Para guardar tus números y ver estadísticas:
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center">
                <a 
                  href="/login" 
                  className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-xs sm:text-sm min-h-[44px] flex items-center justify-center"
                >
                  🔑 Inicia Sesión
                </a>
                <a 
                  href="/register" 
                  className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-lottery-green to-green-500 hover:from-green-500 hover:to-green-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg text-xs sm:text-sm min-h-[44px] flex items-center justify-center"
                >
                  📝 Regístrate
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Generated Numbers Display */}
      {generatedNumbers.length > 0 && (
        <div className="glass rounded-2xl p-4 sm:p-6 lg:p-8">
          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-4 sm:mb-6 text-center">
            Números Generados - {games[selectedGame]?.name || selectedGame.toUpperCase()}
          </h3>
          
          <div className="space-y-4 sm:space-y-6">
            {generatedNumbers.map((numberSet, index) => (
              <div key={numberSet.id} className="text-center">
                {/* Main Numbers */}
                {numberSet.numbers && numberSet.numbers.length > 0 && (
                  <div className="mb-3 sm:mb-4">
                    <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                      {numberSet.numbers.map((number: number, numIndex: number) => (
                        <LotteryNumber
                          key={numIndex}
                          number={number}
                          gameType={selectedGame}
                          size="md"
                          animated={true}
                          className="transform hover:scale-110 transition-transform duration-200"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Más Number */}
                {numberSet.mas && (
                  <div className="mb-3 sm:mb-4">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-white/80 text-xs sm:text-sm lg:text-base">Más:</span>
                      <LotteryNumber
                        number={numberSet.mas}
                        gameType={selectedGame}
                        size="md"
                        isMas={true}
                        className="transform hover:scale-110 transition-transform duration-200"
                      />
                    </div>
                  </div>
                )}

                {/* Combination Info */}
                <div className="text-white/60 text-xs sm:text-sm">
                  Combinación {index + 1} - {new Date().toLocaleString('es-ES')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NumberGenerator; 