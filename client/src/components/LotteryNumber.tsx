import React from 'react';
import { GameType } from '../types';

interface LotteryNumberProps {
  number: number;
  gameType: GameType;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
  isMas?: boolean;
  onClick?: () => void;
}

const LotteryNumber: React.FC<LotteryNumberProps> = ({ 
  number, 
  gameType, 
  size = 'md',
  animated = false,
  className = '',
  isMas = false,
  onClick
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm',
    md: 'w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 text-sm sm:text-lg lg:text-xl',
    lg: 'w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 text-base sm:text-xl lg:text-2xl'
  };

  const formatNumber = (num: number): string => {
    return num.toString().padStart(2, '0');
  };

  // Si es el número Más, usar fondo azul con !important para sobrescribir cualquier otro fondo
  const masStyle = isMas
    ? { background: 'linear-gradient(to right, #2563eb, #3b82f6)', border: '2px solid #60a5fa', color: '#fff' }
    : {};

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      className={`
        lottery-number ${gameType}
        ${sizeClasses[size]}
        ${isMas ? '' : className}
        touch-manipulation
        ${onClick ? 'cursor-pointer' : ''}
        flex items-center justify-center
      `}
      style={masStyle}
      title={`${isMas ? 'Más ' : ''}Número ${formatNumber(number)} - ${gameType.toUpperCase()}`}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {formatNumber(number)}
    </div>
  );
};

export default LotteryNumber; 