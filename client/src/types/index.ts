export interface User {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  website?: string; // honeypot field
  humanCheck?: boolean; // human verification
  formStartTime?: number; // form timing
}

export type GameType = 'leidsa' | 'kino' | 'pale' | 'tripleta';

export interface GameConfig {
  name: string;
  maxNumber: number;
  numbersToPick: number;
  description: string;
  hasMas?: boolean;
  masMaxNumber?: number;
}

export interface GeneratedNumbers {
  id: string;
  numbers: number[];
  mas?: number;
  game_type: GameType;
  generated_at: string;
}

export interface GenerateNumbersRequest {
  game_type: GameType;
  quantity?: number;
  include_mas?: boolean;
  generate_mas_only?: boolean;
}

export interface LotteryResponse {
  success: boolean;
  numbers: GeneratedNumbers[];
  game_type: GameType;
  quantity: number;
  demo?: boolean;
}

export interface NumberStatistics {
  number: number;
  frequency: number;
  percentage: string;
}

export interface ProbabilityAnalysis {
  game_type: GameType;
  total_generations: number;
  number_frequencies: NumberStatistics[];
  hot_numbers: number[];
  cold_numbers: number[];
  last_updated: string;
}

export interface UserStats {
  total_generations: number;
  favorite_numbers: number[];
  most_used_game_type: GameType | null;
  last_generation: string | null;
}

export interface GlobalStats {
  total_users: number;
  total_generations: number;
  generations_by_game_type: Array<{
    game_type: GameType;
    count: number;
  }>;
  most_popular_numbers: Array<{
    number: number;
    frequency: number;
  }>;
  last_updated: string;
}

export interface PersonalStats {
  total_generations: number;
  generations_by_game_type: Array<{
    game_type: GameType;
    count: number;
  }>;
  favorite_numbers: Array<{
    number: number;
    frequency: number;
  }>;
  last_updated: string;
} 