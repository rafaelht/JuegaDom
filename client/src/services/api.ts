import axios from 'axios';
import { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  GenerateNumbersRequest, 
  LotteryResponse,
  ProbabilityAnalysis,
  GlobalStats,
  PersonalStats,
  UserStats,
  GameType
} from '../types';

// API base URL - use environment variable or default to localhost
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data);
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  resendVerification: async (data: { email: string }) => {
    const response = await api.post('/auth/resend-verification', data);
    return response.data;
  },
};

// Lottery API
export const lotteryAPI = {
  generateNumbers: async (data: GenerateNumbersRequest): Promise<LotteryResponse> => {
    const response = await api.post('/lottery/generate', data);
    return response.data;
  },

  generateDemoNumbers: async (data: GenerateNumbersRequest): Promise<LotteryResponse> => {
    const response = await api.post('/lottery/generate-demo', data);
    return response.data;
  },

  saveDemoNumbers: async (data: { game_type: GameType; numbers: number[]; mas?: number }) => {
    const response = await api.post('/lottery/save-demo', data);
    return response.data;
  },

  getMyNumbers: async (params?: { game_type?: string; limit?: number; offset?: number }) => {
    const response = await api.get('/lottery/my-numbers', { params });
    return response.data;
  },

  getGames: async () => {
    const response = await api.get('/lottery/games');
    return response.data;
  },

  getGlobalStats: async (gameType?: string) => {
    const response = await api.get('/lottery/stats/global', { params: { game_type: gameType } });
    return response.data;
  },

  getHotNumbers: async (gameType?: string, limit?: number) => {
    const response = await api.get('/lottery/stats/hot-numbers', { params: { game_type: gameType, limit } });
    return response.data;
  },

  getColdNumbers: async (gameType?: string, limit?: number) => {
    const response = await api.get('/lottery/stats/cold-numbers', { params: { game_type: gameType, limit } });
    return response.data;
  },

  deleteNumber: async (id: string) => {
    const response = await api.delete(`/lottery/my-numbers/${id}`);
    return response.data;
  },

  deleteAllNumbers: async () => {
    const response = await api.delete('/lottery/my-numbers');
    return response.data;
  },
};

// User API
export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  updatePassword: async (data: { currentPassword: string; newPassword: string }) => {
    const response = await api.put('/user/password', data);
    return response.data;
  },

  updateProfile: async (data: { username?: string; email?: string }) => {
    const response = await api.put('/user/profile', data);
    return response.data;
  }
};

// Statistics API
export const statsAPI = {
  getProbabilityAnalysis: async (gameType: string, limit?: number): Promise<{ success: boolean; analysis: ProbabilityAnalysis }> => {
    const response = await api.get(`/stats/probability/${gameType}`, {
      params: { limit }
    });
    return response.data;
  },

  getGlobalStats: async (): Promise<{ success: boolean; stats: GlobalStats }> => {
    const response = await api.get('/stats/global');
    return response.data;
  },

  getPersonalStats: async (): Promise<{ success: boolean; stats: PersonalStats }> => {
    const response = await api.get('/stats/personal');
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  // Get all users
  getUsers: async (page = 1, limit = 10, search = '') => {
    const response = await api.get(`/admin/users?page=${page}&limit=${limit}&search=${search}`);
    return response.data;
  },

  // Get all lottery numbers
  getLotteryNumbers: async (page = 1, limit = 10, userId = '', gameType = '', includeDeleted = false) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      includeDeleted: includeDeleted.toString()
    });
    if (userId) params.append('userId', userId);
    if (gameType) params.append('gameType', gameType);
    
    const response = await api.get(`/admin/lottery-numbers?${params}`);
    return response.data;
  },

  // Update user
  updateUser: async (userId: string, data: { username: string; email: string; is_admin: boolean }) => {
    const response = await api.put(`/admin/users/${userId}`, data);
    return response.data;
  },

  // Delete user
  deleteUser: async (userId: string) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  },

  // Delete lottery number
  deleteLotteryNumber: async (numberId: string) => {
    const response = await api.delete(`/admin/lottery-numbers/${numberId}`);
    return response.data;
  },

  // Restore lottery number
  restoreLotteryNumber: async (numberId: string) => {
    const response = await api.put(`/admin/lottery-numbers/${numberId}/restore`);
    return response.data;
  },

  // Get admin stats
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  }
};

export default api; 