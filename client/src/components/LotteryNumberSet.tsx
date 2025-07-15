import React from 'react';
import { GameType } from '../types';
import LotteryNumber from './LotteryNumber';

interface LotteryNumberSetProps {
  numbers: number[];
  mas?: number;
  gameType: GameType;
  showGameType?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const LotteryNumberSet: React.FC<LotteryNumberSetProps> = ({
  numbers,
  mas,
  gameType,
  showGameType = true,
  size = 'md',
  animated = false
}) => {
  const gameLabels: Record<GameType, string> = {
    leidsa: 'Leidsa',
    kino: 'Kino',
    pale: 'Pale',
    tripleta: 'Tripleta'
  };

  return (
    <div className="space-y-3">
      {showGameType && (
        <div className="text-center">
          <span className="text-lottery-gold font-semibold text-sm sm:text-base">
            {gameLabels[gameType]}
          </span>
        </div>
      )}
      
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {numbers.map((number, index) => (
          <LotteryNumber
            key={index}
            number={number}
            gameType={gameType}
            size={size}
            animated={animated}
            className={animated ? 'animate-bounce' : ''}
          />
        ))}
      </div>
      
      {mas !== undefined && (
        <div className="flex justify-center mt-2 sm:mt-3">
          <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-2">
            <span className="text-white/60 text-xs sm:text-sm">Más:</span>
            <LotteryNumber
              number={mas}
              gameType={gameType}
              size={size}
              isMas={true}
              animated={animated}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default LotteryNumberSet; 